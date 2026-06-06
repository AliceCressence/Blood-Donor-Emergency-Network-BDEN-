pipeline {
    agent any

    options {
        timestamps()
        ansiColor('xterm')
        skipDefaultCheckout(false)
        disableConcurrentBuilds()
    }

    parameters {
        booleanParam(
            name: 'DEPLOY_PROD',
            defaultValue: true,
            description: 'Deploy to the VPS production Kubernetes stack when this build runs on main.'
        )
        booleanParam(
            name: 'DEPLOY_ONLY',
            defaultValue: false,
            description: 'Skip CI checks/tests and only run production build/deploy. Use for manual deploy retries after CI has already passed.'
        )
    }

    environment {
        CI_PROJECT = 'bden-ci'
        PROD_PROJECT = 'bden-prod'
        CI_ENV_FILE = '.env.example'
        PROD_ENV_FILE = '.env.prod'
        BDEN_GATEWAY_HOST_PORT = '8080'
        BDEN_FRONTEND_HOST_PORT = '8088'
        BDEN_PUBLIC_HOST = 'bden.hinkaku.tech'
        K8S_NAMESPACE = 'bden-prod'
        LOCAL_REGISTRY = 'localhost:5000'
        VITE_API_BASE_URL = 'http://localhost:8000'
        PORT_PREFIX = '1'
        BDEN_BUILD_NETWORK = 'host'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                sh 'git remote -v'
                sh 'git rev-parse --abbrev-ref HEAD'
                script {
                    env.IS_MAIN_BRANCH = sh(
                        returnStdout: true,
                        script: 'test "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" && echo true || echo false'
                    ).trim()
                    echo "IS_MAIN_BRANCH=${env.IS_MAIN_BRANCH}"
                }
            }
        }

        stage('Compose Validation') {
            steps {
                sh 'docker compose --env-file ${CI_ENV_FILE} -p ${CI_PROJECT} config --quiet'
                sh 'docker compose --env-file ${CI_ENV_FILE} -f docker-compose.prod.yml -p ${PROD_PROJECT} config --quiet'
            }
        }

        stage('Backend Syntax Checks') {
            when {
                expression { return !params.DEPLOY_ONLY }
            }
            steps {
                sh 'python3 -m compileall services/auth-service services/donor-service services/request-service services/campaign-service services/notification-service'
            }
        }

        stage('Docker Network Preflight') {
            when {
                expression { return !params.DEPLOY_ONLY }
            }
            steps {
                sh 'docker run --rm --network host python:3.11-slim-bookworm python -c "import socket; print(socket.gethostbyname(\\\"pypi.org\\\"))"'
            }
        }

        stage('Build CI Images') {
            when {
                expression { return !params.DEPLOY_ONLY }
            }
            steps {
                sh 'docker compose --env-file ${CI_ENV_FILE} -p ${CI_PROJECT} build auth-service donor-service request-service campaign-service notification-service'
            }
        }

        stage('Start CI Dependencies') {
            when {
                expression { return !params.DEPLOY_ONLY }
            }
            steps {
                sh 'docker compose --env-file ${CI_ENV_FILE} -p ${CI_PROJECT} up -d --wait auth-db donor-db request-db campaign-db notification-db redis'
                sh 'docker compose --env-file ${CI_ENV_FILE} -p ${CI_PROJECT} ps'
            }
        }

        stage('Django Checks') {
            when {
                expression { return !params.DEPLOY_ONLY }
            }
            steps {
                sh 'docker compose --env-file ${CI_ENV_FILE} -p ${CI_PROJECT} run --rm auth-service python manage.py check'
                sh 'docker compose --env-file ${CI_ENV_FILE} -p ${CI_PROJECT} run --rm donor-service python manage.py check'
                sh 'docker compose --env-file ${CI_ENV_FILE} -p ${CI_PROJECT} run --rm request-service python manage.py check'
                sh 'docker compose --env-file ${CI_ENV_FILE} -p ${CI_PROJECT} run --rm campaign-service python manage.py check'
                sh 'docker compose --env-file ${CI_ENV_FILE} -p ${CI_PROJECT} run --rm notification-service python manage.py check'
            }
        }

        stage('Django Tests') {
            when {
                expression { return !params.DEPLOY_ONLY }
            }
            steps {
                sh 'docker compose --env-file ${CI_ENV_FILE} -p ${CI_PROJECT} run --rm auth-service pytest'
                sh 'docker compose --env-file ${CI_ENV_FILE} -p ${CI_PROJECT} run --rm donor-service pytest'
                sh 'docker compose --env-file ${CI_ENV_FILE} -p ${CI_PROJECT} run --rm request-service pytest'
                sh 'docker compose --env-file ${CI_ENV_FILE} -p ${CI_PROJECT} run --rm campaign-service pytest'
                sh 'docker compose --env-file ${CI_ENV_FILE} -p ${CI_PROJECT} run --rm notification-service pytest'
            }
        }

        stage('Frontend Build') {
            when {
                expression { return !params.DEPLOY_ONLY }
            }
            steps {
                sh 'docker compose --env-file ${CI_ENV_FILE} -f docker-compose.prod.yml -p ${CI_PROJECT} build frontend'
            }
        }

        stage('Build Production Images') {
            when {
                anyOf {
                    expression { return env.IS_MAIN_BRANCH == 'true' }
                    changeRequest(target: 'main')
                }
            }
            steps {
                sh 'docker compose --env-file ${CI_ENV_FILE} -f docker-compose.prod.yml -p ${PROD_PROJECT} build'
            }
        }

        stage('Deploy Production to Kubernetes') {
            when {
                allOf {
                    expression { return env.IS_MAIN_BRANCH == 'true' }
                    expression { return params.DEPLOY_PROD || params.DEPLOY_ONLY }
                }
            }
            steps {
                script {
                    env.RESOLVED_PROD_ENV_FILE = sh(
                        returnStdout: true,
                        script: '''
                            set -eu
                            for candidate in "${PROD_ENV_FILE}" /var/www/bden/.env.prod; do
                                if [ -f "$candidate" ]; then
                                    printf '%s' "$candidate"
                                    exit 0
                                fi
                            done
                            echo "ERROR: missing production env file. Create .env.prod in the Jenkins workspace or /var/www/bden/.env.prod on the VPS." >&2
                            exit 1
                        '''
                    ).trim()
                    echo "Using production env file: ${env.RESOLVED_PROD_ENV_FILE}"
                }
                sh 'docker compose --env-file ${RESOLVED_PROD_ENV_FILE} -f docker-compose.prod.yml -p ${PROD_PROJECT} config --quiet'
                sh 'docker compose --env-file ${RESOLVED_PROD_ENV_FILE} -f docker-compose.prod.yml -p ${PROD_PROJECT} build'
                sh '''
                    set -eu

                    rollout_status() {
                        kind="$1"
                        name="$2"
                        timeout="${3:-240s}"
                        namespace="${4:-$K8S_NAMESPACE}"

                        if kubectl rollout status "${kind}/${name}" -n "${namespace}" --timeout="${timeout}"; then
                            return 0
                        fi

                        echo "ERROR: rollout failed for ${kind}/${name}" >&2
                        echo "--- Pods ---" >&2
                        kubectl get pods -n "${namespace}" -o wide || true
                        echo "--- ${kind}/${name} details ---" >&2
                        kubectl describe "${kind}/${name}" -n "${namespace}" || true
                        echo "--- Recent namespace events ---" >&2
                        kubectl get events -n "${namespace}" --sort-by=.lastTimestamp | tail -120 || true
                        echo "--- Logs for app=${name} ---" >&2
                        kubectl logs -n "${namespace}" -l "app=${name}" --all-containers --tail=180 || true
                        exit 1
                    }

                    if ! docker inspect bden-local-registry >/dev/null 2>&1; then
                        docker run -d \
                            --restart unless-stopped \
                            --name bden-local-registry \
                            -p 127.0.0.1:5000:5000 \
                            registry:2
                    elif ! docker inspect -f '{{.State.Running}}' bden-local-registry | grep -q true; then
                        docker start bden-local-registry
                    fi

                    if sudo -n true >/dev/null 2>&1; then
                        sudo mkdir -p /etc/rancher/k3s
                        if [ ! -f /etc/rancher/k3s/registries.yaml ] || ! sudo grep -q "127.0.0.1:5000" /etc/rancher/k3s/registries.yaml; then
                            cat > /tmp/bden-registries.yaml <<'EOF'
mirrors:
  "localhost:5000":
    endpoint:
      - "http://127.0.0.1:5000"
EOF
                            sudo cp /tmp/bden-registries.yaml /etc/rancher/k3s/registries.yaml
                            sudo systemctl restart k3s
                            kubectl wait --for=condition=Ready node --all --timeout=180s
                        fi
                    else
                        echo "WARNING: Jenkins cannot configure /etc/rancher/k3s/registries.yaml without sudo. Ensure k3s trusts http://127.0.0.1:5000 for localhost:5000 image pulls."
                    fi

                    publish_image() {
                        compose_image="$1"
                        registry_image="$2"
                        docker tag "${compose_image}" "${LOCAL_REGISTRY}/bden/${registry_image}:latest"
                        docker tag "${compose_image}" "${LOCAL_REGISTRY}/bden/${registry_image}:${BUILD_NUMBER}"
                        docker push "${LOCAL_REGISTRY}/bden/${registry_image}:latest"
                        docker push "${LOCAL_REGISTRY}/bden/${registry_image}:${BUILD_NUMBER}"
                    }

                    publish_image "${PROD_PROJECT}-frontend:latest" frontend
                    publish_image "${PROD_PROJECT}-auth-service:latest" auth-service
                    publish_image "${PROD_PROJECT}-donor-service:latest" donor-service
                    publish_image "${PROD_PROJECT}-request-service:latest" request-service
                    publish_image "${PROD_PROJECT}-campaign-service:latest" campaign-service
                    publish_image "${PROD_PROJECT}-notification-service:latest" notification-service

                    kubectl apply -f infrastructure/k8s/namespace.yaml
                    kubectl create secret generic bden-env \
                        --namespace="${K8S_NAMESPACE}" \
                        --from-env-file="${RESOLVED_PROD_ENV_FILE}" \
                        --dry-run=client -o yaml | kubectl apply -f -

                    kubectl apply -f infrastructure/k8s/data-services.yaml
                    rollout_status statefulset auth-db 180s
                    rollout_status statefulset donor-db 180s
                    rollout_status statefulset request-db 180s
                    rollout_status statefulset campaign-db 180s
                    rollout_status statefulset notification-db 180s
                    rollout_status statefulset redis 180s

                    echo "--- Verifying Kubernetes DNS before app rollout ---"
                    rollout_status deployment coredns 180s kube-system
                    kubectl get svc auth-db donor-db request-db campaign-db notification-db redis -n "${K8S_NAMESPACE}"
                    kubectl get endpoints auth-db donor-db request-db campaign-db notification-db redis -n "${K8S_NAMESPACE}"

                    kubectl delete pod bden-dns-check -n "${K8S_NAMESPACE}" --ignore-not-found=true
                    kubectl run bden-dns-check \
                        -n "${K8S_NAMESPACE}" \
                        --image=busybox:1.36 \
                        --restart=Never \
                        --command -- sleep 300
                    kubectl wait --for=condition=Ready pod/bden-dns-check -n "${K8S_NAMESPACE}" --timeout=90s

                    dns_ok=false
                    for attempt in $(seq 1 30); do
                        if kubectl exec -n "${K8S_NAMESPACE}" bden-dns-check -- nslookup "auth-db.${K8S_NAMESPACE}.svc.cluster.local"; then
                            dns_ok=true
                            break
                        fi

                        echo "Waiting for Kubernetes DNS to resolve auth-db (${attempt}/30)"
                        sleep 5
                    done

                    kubectl delete pod bden-dns-check -n "${K8S_NAMESPACE}" --ignore-not-found=true

                    if [ "${dns_ok}" != "true" ] && sudo -n true >/dev/null 2>&1; then
                        echo "Kubernetes DNS did not resolve on first attempt. Restarting k3s once and retrying DNS preflight."
                        sudo systemctl restart k3s
                        kubectl wait --for=condition=Ready node --all --timeout=180s
                        rollout_status deployment coredns 180s kube-system

                        kubectl delete pod bden-dns-check -n "${K8S_NAMESPACE}" --ignore-not-found=true
                        kubectl run bden-dns-check \
                            -n "${K8S_NAMESPACE}" \
                            --image=busybox:1.36 \
                            --restart=Never \
                            --command -- sleep 300
                        kubectl wait --for=condition=Ready pod/bden-dns-check -n "${K8S_NAMESPACE}" --timeout=90s

                        for attempt in $(seq 1 30); do
                            if kubectl exec -n "${K8S_NAMESPACE}" bden-dns-check -- nslookup "auth-db.${K8S_NAMESPACE}.svc.cluster.local"; then
                                dns_ok=true
                                break
                            fi

                            echo "Waiting for Kubernetes DNS after k3s restart (${attempt}/30)"
                            sleep 5
                        done

                        kubectl delete pod bden-dns-check -n "${K8S_NAMESPACE}" --ignore-not-found=true
                    fi

                    if [ "${dns_ok}" != "true" ]; then
                        echo "ERROR: Kubernetes DNS cannot resolve auth-db.${K8S_NAMESPACE}.svc.cluster.local" >&2
                        kubectl get pods -n kube-system -o wide || true
                        kubectl logs -n kube-system deployment/coredns --all-containers --tail=200 || true
                        kubectl describe deployment/coredns -n kube-system || true
                        exit 1
                    fi

                    kubectl apply -f infrastructure/k8s/app-services.yaml
                    kubectl apply -f infrastructure/k8s/event-consumers.yaml
                    kubectl apply -f infrastructure/k8s/frontend-gateway.yaml

                    kubectl set image deployment/frontend frontend="${LOCAL_REGISTRY}/bden/frontend:${BUILD_NUMBER}" -n "${K8S_NAMESPACE}"
                    kubectl set image deployment/auth-service auth-service="${LOCAL_REGISTRY}/bden/auth-service:${BUILD_NUMBER}" -n "${K8S_NAMESPACE}"
                    kubectl set image deployment/donor-service donor-service="${LOCAL_REGISTRY}/bden/donor-service:${BUILD_NUMBER}" -n "${K8S_NAMESPACE}"
                    kubectl set image deployment/request-service request-service="${LOCAL_REGISTRY}/bden/request-service:${BUILD_NUMBER}" -n "${K8S_NAMESPACE}"
                    kubectl set image deployment/campaign-service campaign-service="${LOCAL_REGISTRY}/bden/campaign-service:${BUILD_NUMBER}" -n "${K8S_NAMESPACE}"
                    kubectl set image deployment/notification-service notification-service="${LOCAL_REGISTRY}/bden/notification-service:${BUILD_NUMBER}" -n "${K8S_NAMESPACE}"
                    kubectl set image deployment/donor-event-consumer donor-event-consumer="${LOCAL_REGISTRY}/bden/donor-service:${BUILD_NUMBER}" -n "${K8S_NAMESPACE}"
                    kubectl set image deployment/request-event-consumer request-event-consumer="${LOCAL_REGISTRY}/bden/request-service:${BUILD_NUMBER}" -n "${K8S_NAMESPACE}"
                    kubectl set image deployment/notification-event-consumer notification-event-consumer="${LOCAL_REGISTRY}/bden/notification-service:${BUILD_NUMBER}" -n "${K8S_NAMESPACE}"
                    kubectl rollout restart deployment/gateway -n "${K8S_NAMESPACE}"

                    rollout_status deployment frontend 900s
                    rollout_status deployment auth-service 900s
                    rollout_status deployment donor-service 900s
                    rollout_status deployment request-service 900s
                    rollout_status deployment campaign-service 900s
                    rollout_status deployment notification-service 900s
                    rollout_status deployment gateway 900s

                    if sudo -n true >/dev/null 2>&1; then
                        sudo cp infrastructure/nginx/bden.host.k8s.conf /etc/nginx/sites-available/bden
                        sudo ln -sf /etc/nginx/sites-available/bden /etc/nginx/sites-enabled/bden
                        sudo nginx -t
                        sudo systemctl reload nginx
                    else
                        echo "WARNING: Jenkins cannot update host Nginx without sudo. Ensure /etc/nginx/sites-available/bden proxies bden.hinkaku.tech to http://127.0.0.1:30080"
                    fi
                '''
                sh '''
                    set -eu

                    check_url() {
                        name="$1"
                        url="$2"

                        for attempt in $(seq 1 30); do
                            if curl -fsS --max-time 5 -H "Host: ${BDEN_PUBLIC_HOST}" "$url"; then
                                echo "${name} health check passed"
                                return 0
                            fi

                            echo "Waiting for ${name} health check (${attempt}/30): ${url}"
                            sleep 5
                        done

                        echo "ERROR: ${name} health check failed after retries: ${url}" >&2
                        kubectl get pods -n "${K8S_NAMESPACE}" -o wide
                        kubectl get events -n "${K8S_NAMESPACE}" --sort-by=.lastTimestamp | tail -80
                        exit 1
                    }

                    check_url gateway "http://127.0.0.1:30080/health/"
                    check_url auth "http://127.0.0.1:30080/health/auth/"
                    check_url donor "http://127.0.0.1:30080/health/donor/"
                    check_url request "http://127.0.0.1:30080/health/request/"
                    check_url campaign "http://127.0.0.1:30080/health/campaign/"
                    check_url notification "http://127.0.0.1:30080/health/notification/"
                '''
            }
        }
    }

    post {
        always {
            sh 'docker compose --env-file ${CI_ENV_FILE} -p ${CI_PROJECT} down --remove-orphans -v'
        }
    }
}
