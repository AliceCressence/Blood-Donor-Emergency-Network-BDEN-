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

                    sudo_systemctl() {
                        if sudo -n /bin/systemctl "$@" >/dev/null 2>&1; then
                            return 0
                        fi

                        if sudo -n /usr/bin/systemctl "$@" >/dev/null 2>&1; then
                            return 0
                        fi

                        return 1
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

                    if sudo -n mkdir -p /etc/rancher/k3s >/dev/null 2>&1; then
                        sudo -n mkdir -p /etc/rancher/k3s
                        cat > /tmp/bden-registries.yaml <<'EOF'
mirrors:
  "localhost:5000":
    endpoint:
      - "http://127.0.0.1:5000"
EOF
                        if sudo -n cp /tmp/bden-registries.yaml /etc/rancher/k3s/registries.yaml; then
                            sudo_systemctl restart k3s || echo "WARNING: Jenkins could not restart k3s with sudo systemctl."
                            kubectl wait --for=condition=Ready node --all --timeout=180s
                        else
                            echo "WARNING: Jenkins could not update /etc/rancher/k3s/registries.yaml."
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

                    deploy_compose_fallback() {
                        reason="$1"
                        echo "WARNING: ${reason}" >&2
                        echo "WARNING: Falling back to production Docker Compose so bden.hinkaku.tech can come online while k3s CNI is repaired." >&2

                        export BDEN_GATEWAY_HOST_PORT="${BDEN_GATEWAY_HOST_PORT:-8080}"
                        export BDEN_FRONTEND_HOST_PORT="${BDEN_FRONTEND_HOST_PORT:-8088}"
                        export AUTH_DB_HOST_PORT=25432
                        export DONOR_DB_HOST_PORT=25433
                        export REQUEST_DB_HOST_PORT=25434
                        export CAMPAIGN_DB_HOST_PORT=25435
                        export NOTIFICATION_DB_HOST_PORT=25436
                        export REDIS_HOST_PORT=26379
                        export AUTH_SERVICE_HOST_PORT=18001
                        export DONOR_SERVICE_HOST_PORT=18002
                        export REQUEST_SERVICE_HOST_PORT=18003
                        export CAMPAIGN_SERVICE_HOST_PORT=18004
                        export NOTIFICATION_SERVICE_HOST_PORT=18005

                        echo "Using Compose fallback host ports:"
                        echo "frontend=${BDEN_FRONTEND_HOST_PORT} gateway=${BDEN_GATEWAY_HOST_PORT}"
                        echo "auth-db=${AUTH_DB_HOST_PORT} donor-db=${DONOR_DB_HOST_PORT} request-db=${REQUEST_DB_HOST_PORT} campaign-db=${CAMPAIGN_DB_HOST_PORT} notification-db=${NOTIFICATION_DB_HOST_PORT} redis=${REDIS_HOST_PORT}"
                        echo "auth-service=${AUTH_SERVICE_HOST_PORT} donor-service=${DONOR_SERVICE_HOST_PORT} request-service=${REQUEST_SERVICE_HOST_PORT} campaign-service=${CAMPAIGN_SERVICE_HOST_PORT} notification-service=${NOTIFICATION_SERVICE_HOST_PORT}"

                        docker compose --env-file "${RESOLVED_PROD_ENV_FILE}" -f docker-compose.prod.yml -p "${PROD_PROJECT}" up -d --remove-orphans
                        docker compose --env-file "${RESOLVED_PROD_ENV_FILE}" -f docker-compose.prod.yml -p "${PROD_PROJECT}" ps

                        if sudo -n cp infrastructure/nginx/bden.host.compose.conf /etc/nginx/sites-available/bden &&
                            sudo -n ln -sf /etc/nginx/sites-available/bden /etc/nginx/sites-enabled/bden &&
                            sudo -n nginx -t; then
                            sudo_systemctl reload nginx || echo "WARNING: Jenkins could not reload Nginx with sudo systemctl."
                        else
                            echo "WARNING: Jenkins cannot update host Nginx without sudo. Manually copy infrastructure/nginx/bden.host.compose.conf to /etc/nginx/sites-available/bden and reload Nginx." >&2
                        fi

                        echo compose > .bden_deploy_mode
                    }

                    publish_image "${PROD_PROJECT}-frontend:latest" frontend
                    publish_image "${PROD_PROJECT}-auth-service:latest" auth-service
                    publish_image "${PROD_PROJECT}-donor-service:latest" donor-service
                    publish_image "${PROD_PROJECT}-request-service:latest" request-service
                    publish_image "${PROD_PROJECT}-campaign-service:latest" campaign-service
                    publish_image "${PROD_PROJECT}-notification-service:latest" notification-service

                    kubectl apply -f infrastructure/k8s/namespace.yaml
                    kubectl apply -f infrastructure/k8s/network-policy.yaml
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

                    service_ip() {
                        kubectl get svc "$1" -n "${K8S_NAMESPACE}" -o jsonpath='{.spec.clusterIP}'
                    }

                    endpoint_ip() {
                        kubectl get endpoints "$1" -n "${K8S_NAMESPACE}" -o jsonpath='{.subsets[0].addresses[0].ip}'
                    }

                    AUTH_DB_IP="$(endpoint_ip auth-db)"
                    DONOR_DB_IP="$(endpoint_ip donor-db)"
                    REQUEST_DB_IP="$(endpoint_ip request-db)"
                    CAMPAIGN_DB_IP="$(endpoint_ip campaign-db)"
                    NOTIFICATION_DB_IP="$(endpoint_ip notification-db)"
                    REDIS_IP="$(endpoint_ip redis)"

                    echo "Using data endpoint IPs:"
                    echo "auth-db=${AUTH_DB_IP} donor-db=${DONOR_DB_IP} request-db=${REQUEST_DB_IP} campaign-db=${CAMPAIGN_DB_IP} notification-db=${NOTIFICATION_DB_IP} redis=${REDIS_IP}"

                    echo "--- Verifying pod-to-pod connectivity to data endpoints ---"
                    kubectl delete pod bden-network-check -n "${K8S_NAMESPACE}" --ignore-not-found=true
                    kubectl run bden-network-check \
                        -n "${K8S_NAMESPACE}" \
                        --image=busybox:1.36 \
                        --restart=Never \
                        --command -- sleep 300
                    kubectl wait --for=condition=Ready pod/bden-network-check -n "${K8S_NAMESPACE}" --timeout=90s

                    for target in "${AUTH_DB_IP}:5432" "${DONOR_DB_IP}:5432" "${REQUEST_DB_IP}:5432" "${CAMPAIGN_DB_IP}:5432" "${NOTIFICATION_DB_IP}:5432" "${REDIS_IP}:6379"; do
                        host="${target%:*}"
                        port="${target#*:}"
                        if ! kubectl exec -n "${K8S_NAMESPACE}" bden-network-check -- nc -w 5 -z "${host}" "${port}"; then
                            echo "ERROR: Kubernetes pod network cannot reach ${target}" >&2
                            kubectl get pods -n "${K8S_NAMESPACE}" -o wide || true
                            kubectl get endpoints -n "${K8S_NAMESPACE}" || true
                            kubectl describe pod bden-network-check -n "${K8S_NAMESPACE}" || true
                            kubectl delete pod bden-network-check -n "${K8S_NAMESPACE}" --ignore-not-found=true
                            deploy_compose_fallback "Kubernetes pod network cannot reach ${target}."
                            exit 0
                        fi
                    done

                    kubectl delete pod bden-network-check -n "${K8S_NAMESPACE}" --ignore-not-found=true

                    echo "--- Verifying Kubernetes DNS before app rollout ---"
                    rollout_status deployment coredns 180s kube-system
                    kubectl get networkpolicy -A
                    kubectl get svc kube-dns -n kube-system -o wide
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
                        kubectl exec -n "${K8S_NAMESPACE}" bden-dns-check -- cat /etc/resolv.conf || true
                        kubectl exec -n "${K8S_NAMESPACE}" bden-dns-check -- nslookup kubernetes.default.svc.cluster.local || true
                        kubectl exec -n "${K8S_NAMESPACE}" bden-dns-check -- nslookup auth-db || true

                        if kubectl exec -n "${K8S_NAMESPACE}" bden-dns-check -- nslookup "auth-db.${K8S_NAMESPACE}.svc.cluster.local"; then
                            dns_ok=true
                            break
                        fi

                        echo "Waiting for Kubernetes DNS to resolve auth-db (${attempt}/30)"
                        sleep 5
                    done

                    kubectl delete pod bden-dns-check -n "${K8S_NAMESPACE}" --ignore-not-found=true

                    if [ "${dns_ok}" != "true" ]; then
                        echo "Kubernetes DNS did not resolve on first attempt. Restarting k3s once and retrying DNS preflight."
                        if sudo_systemctl restart k3s; then
                            kubectl wait --for=condition=Ready node --all --timeout=180s
                            rollout_status deployment coredns 180s kube-system

                            kubectl apply -f infrastructure/k8s/network-policy.yaml
                            kubectl get networkpolicy -A
                            kubectl get svc kube-dns -n kube-system -o wide

                            kubectl delete pod bden-dns-check -n "${K8S_NAMESPACE}" --ignore-not-found=true
                            kubectl run bden-dns-check \
                                -n "${K8S_NAMESPACE}" \
                                --image=busybox:1.36 \
                                --restart=Never \
                                --command -- sleep 300
                            kubectl wait --for=condition=Ready pod/bden-dns-check -n "${K8S_NAMESPACE}" --timeout=90s

                            for attempt in $(seq 1 30); do
                                kubectl exec -n "${K8S_NAMESPACE}" bden-dns-check -- cat /etc/resolv.conf || true
                                kubectl exec -n "${K8S_NAMESPACE}" bden-dns-check -- nslookup kubernetes.default.svc.cluster.local || true
                                kubectl exec -n "${K8S_NAMESPACE}" bden-dns-check -- nslookup auth-db || true

                                if kubectl exec -n "${K8S_NAMESPACE}" bden-dns-check -- nslookup "auth-db.${K8S_NAMESPACE}.svc.cluster.local"; then
                                    dns_ok=true
                                    break
                                fi

                                echo "Waiting for Kubernetes DNS after k3s restart (${attempt}/30)"
                                sleep 5
                            done

                            kubectl delete pod bden-dns-check -n "${K8S_NAMESPACE}" --ignore-not-found=true
                        else
                            echo "WARNING: Jenkins could not restart k3s. Configure passwordless sudo for systemctl restart k3s or restart k3s manually on the VPS."
                        fi
                    fi

                    if [ "${dns_ok}" != "true" ]; then
                        echo "WARNING: Kubernetes DNS cannot resolve auth-db.${K8S_NAMESPACE}.svc.cluster.local. Continuing with endpoint/ClusterIP-based service wiring." >&2
                        kubectl get pods -n kube-system -o wide || true
                        kubectl logs -n kube-system deployment/coredns --all-containers --tail=200 || true
                        kubectl describe deployment/coredns -n kube-system || true
                    fi

                    kubectl apply -f infrastructure/k8s/app-services.yaml
                    kubectl apply -f infrastructure/k8s/event-consumers.yaml
                    kubectl apply -f infrastructure/k8s/frontend-gateway.yaml

                    AUTH_SERVICE_IP="$(service_ip auth-service)"
                    DONOR_SERVICE_IP="$(service_ip donor-service)"
                    REQUEST_SERVICE_IP="$(service_ip request-service)"
                    CAMPAIGN_SERVICE_IP="$(service_ip campaign-service)"
                    NOTIFICATION_SERVICE_IP="$(service_ip notification-service)"
                    FRONTEND_IP="$(service_ip frontend)"

                    echo "Using app service ClusterIPs:"
                    echo "auth=${AUTH_SERVICE_IP} donor=${DONOR_SERVICE_IP} request=${REQUEST_SERVICE_IP} campaign=${CAMPAIGN_SERVICE_IP} notification=${NOTIFICATION_SERVICE_IP} frontend=${FRONTEND_IP}"

                    kubectl set env deployment/auth-service -n "${K8S_NAMESPACE}" \
                        AUTH_DB_HOST="${AUTH_DB_IP}" \
                        REDIS_URL="redis://${REDIS_IP}:6379/0" \
                        DONOR_SERVICE_INTERNAL_URL="http://${DONOR_SERVICE_IP}:8002" \
                        WAIT_FOR_HOSTS="${AUTH_DB_IP}:5432,${REDIS_IP}:6379"

                    kubectl set env deployment/donor-service -n "${K8S_NAMESPACE}" \
                        DONOR_DB_HOST="${DONOR_DB_IP}" \
                        REDIS_URL="redis://${REDIS_IP}:6379/0" \
                        REDIS_CACHE_URL="redis://${REDIS_IP}:6379/1" \
                        AUTH_SERVICE_INTERNAL_URL="http://${AUTH_SERVICE_IP}:8001" \
                        REQUEST_SERVICE_INTERNAL_URL="http://${REQUEST_SERVICE_IP}:8003" \
                        WAIT_FOR_HOSTS="${DONOR_DB_IP}:5432,${REDIS_IP}:6379"

                    kubectl set env deployment/request-service -n "${K8S_NAMESPACE}" \
                        REQUEST_DB_HOST="${REQUEST_DB_IP}" \
                        REDIS_URL="redis://${REDIS_IP}:6379/0" \
                        DONOR_SERVICE_URL="http://${DONOR_SERVICE_IP}:8002" \
                        NOTIFICATION_SERVICE_URL="http://${NOTIFICATION_SERVICE_IP}:8005" \
                        WAIT_FOR_HOSTS="${REQUEST_DB_IP}:5432,${REDIS_IP}:6379"

                    kubectl set env deployment/campaign-service -n "${K8S_NAMESPACE}" \
                        CAMPAIGN_DB_HOST="${CAMPAIGN_DB_IP}" \
                        REDIS_URL="redis://${REDIS_IP}:6379/0" \
                        DONOR_SERVICE_INTERNAL_URL="http://${DONOR_SERVICE_IP}:8002" \
                        WAIT_FOR_HOSTS="${CAMPAIGN_DB_IP}:5432,${REDIS_IP}:6379"

                    kubectl set env deployment/notification-service -n "${K8S_NAMESPACE}" \
                        NOTIFICATION_DB_HOST="${NOTIFICATION_DB_IP}" \
                        REDIS_URL="redis://${REDIS_IP}:6379/0" \
                        WAIT_FOR_HOSTS="${NOTIFICATION_DB_IP}:5432,${REDIS_IP}:6379"

                    kubectl set env deployment/donor-event-consumer -n "${K8S_NAMESPACE}" \
                        DONOR_DB_HOST="${DONOR_DB_IP}" \
                        REDIS_URL="redis://${REDIS_IP}:6379/0" \
                        REDIS_CACHE_URL="redis://${REDIS_IP}:6379/1" \
                        WAIT_FOR_HOSTS="${DONOR_DB_IP}:5432,${REDIS_IP}:6379"

                    kubectl set env deployment/request-event-consumer -n "${K8S_NAMESPACE}" \
                        REQUEST_DB_HOST="${REQUEST_DB_IP}" \
                        REDIS_URL="redis://${REDIS_IP}:6379/0" \
                        WAIT_FOR_HOSTS="${REQUEST_DB_IP}:5432,${REDIS_IP}:6379"

                    kubectl set env deployment/notification-event-consumer -n "${K8S_NAMESPACE}" \
                        NOTIFICATION_DB_HOST="${NOTIFICATION_DB_IP}" \
                        REDIS_URL="redis://${REDIS_IP}:6379/0" \
                        WAIT_FOR_HOSTS="${NOTIFICATION_DB_IP}:5432,${REDIS_IP}:6379"

                    DOLLAR='$'

                    cat > /tmp/bden-gateway-default.conf <<EOF
upstream frontend_app         { server ${FRONTEND_IP}:80; }
upstream auth_service         { server ${AUTH_SERVICE_IP}:8001; }
upstream donor_service        { server ${DONOR_SERVICE_IP}:8002; }
upstream request_service      { server ${REQUEST_SERVICE_IP}:8003; }
upstream campaign_service     { server ${CAMPAIGN_SERVICE_IP}:8004; }
upstream notification_service { server ${NOTIFICATION_SERVICE_IP}:8005; }

server {
  listen 80;
  server_name _;
  client_max_body_size 10m;

  proxy_set_header Host ${DOLLAR}host;
  proxy_set_header X-Real-IP ${DOLLAR}remote_addr;
  proxy_set_header X-Forwarded-For ${DOLLAR}proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto ${DOLLAR}scheme;

  location = /health/ {
    default_type application/json;
    return 200 '{"service":"BDEN Kubernetes Gateway","status":"ok"}';
  }

  location /api/donor/docs/     { proxy_pass http://donor_service/api/docs/; }
  location /api/donor/redoc/    { proxy_pass http://donor_service/api/redoc/; }
  location /api/campaign/docs/  { proxy_pass http://campaign_service/api/docs/; }
  location /api/campaign/redoc/ { proxy_pass http://campaign_service/api/redoc/; }

  location /api/docs/           { proxy_pass http://auth_service; }
  location /api/schema.json     { proxy_pass http://auth_service; }
  location /api/auth/           { proxy_pass http://auth_service; }
  location /api/admin/          { proxy_pass http://auth_service; }
  location /django-admin/auth/  { proxy_pass http://auth_service/django-admin/; }
  location /django-admin/donor/ { proxy_pass http://donor_service/django-admin/; }

  location /api/donors/         { proxy_pass http://donor_service; }
  location /api/estimation/     { proxy_pass http://donor_service; }
  location /api/requests/       { proxy_pass http://request_service; }
  location /api/campaigns/      { proxy_pass http://campaign_service; }
  location /api/myths/          { proxy_pass http://campaign_service; }
  location /api/ads/            { proxy_pass http://campaign_service; }
  location /api/notifications/  { proxy_pass http://notification_service; }

  location /health/auth/         { proxy_pass http://auth_service/health/; }
  location /health/donor/        { proxy_pass http://donor_service/health/; }
  location /health/request/      { proxy_pass http://request_service/health/; }
  location /health/campaign/     { proxy_pass http://campaign_service/health/; }
  location /health/notification/ { proxy_pass http://notification_service/health/; }

  location / {
    proxy_pass http://frontend_app;
  }
}
EOF

                    kubectl create configmap gateway-nginx-config \
                        -n "${K8S_NAMESPACE}" \
                        --from-file=default.conf=/tmp/bden-gateway-default.conf \
                        --dry-run=client -o yaml | kubectl apply -f -

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

                    if sudo -n cp infrastructure/nginx/bden.host.k8s.conf /etc/nginx/sites-available/bden &&
                        sudo -n ln -sf /etc/nginx/sites-available/bden /etc/nginx/sites-enabled/bden &&
                        sudo -n nginx -t; then
                        sudo_systemctl reload nginx || echo "WARNING: Jenkins could not reload Nginx with sudo systemctl."
                    else
                        echo "WARNING: Jenkins cannot update host Nginx without sudo. Ensure /etc/nginx/sites-available/bden proxies bden.hinkaku.tech to http://127.0.0.1:30080"
                    fi

                    echo k8s > .bden_deploy_mode
                '''
                sh '''
                    set -eu

                    DEPLOY_MODE="$(cat .bden_deploy_mode 2>/dev/null || echo k8s)"

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

                    if [ "${DEPLOY_MODE}" = "compose" ]; then
                        check_url frontend "http://127.0.0.1:8088/health/"
                        check_url gateway "http://127.0.0.1:8080/health/"
                        check_url auth "http://127.0.0.1:8080/health/auth/"
                        check_url donor "http://127.0.0.1:8080/health/donor/"
                        check_url request "http://127.0.0.1:8080/health/request/"
                        check_url campaign "http://127.0.0.1:8080/health/campaign/"
                        check_url notification "http://127.0.0.1:8080/health/notification/"
                    else
                        check_url gateway "http://127.0.0.1:30080/health/"
                        check_url auth "http://127.0.0.1:30080/health/auth/"
                        check_url donor "http://127.0.0.1:30080/health/donor/"
                        check_url request "http://127.0.0.1:30080/health/request/"
                        check_url campaign "http://127.0.0.1:30080/health/campaign/"
                        check_url notification "http://127.0.0.1:30080/health/notification/"
                    fi
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
