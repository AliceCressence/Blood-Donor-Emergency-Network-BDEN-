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
            description: 'Deploy to the VPS production Compose stack when this build runs on main.'
        )
        booleanParam(
            name: 'DEPLOY_ONLY',
            defaultValue: true,
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

        stage('Deploy Production') {
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
                sh 'docker compose --env-file ${RESOLVED_PROD_ENV_FILE} -f docker-compose.prod.yml -p ${PROD_PROJECT} down --remove-orphans'
                sh 'docker compose --env-file ${RESOLVED_PROD_ENV_FILE} -f docker-compose.prod.yml -p ${PROD_PROJECT} up -d --wait --remove-orphans'
                sh '''
                    set -eu

                    check_url() {
                        name="$1"
                        url="$2"

                        for attempt in $(seq 1 30); do
                            if curl -fsS --max-time 5 "$url"; then
                                echo "${name} health check passed"
                                return 0
                            fi

                            echo "Waiting for ${name} health check (${attempt}/30): ${url}"
                            sleep 5
                        done

                        echo "ERROR: ${name} health check failed after retries: ${url}" >&2
                        docker compose --env-file "${RESOLVED_PROD_ENV_FILE}" -f docker-compose.prod.yml -p "${PROD_PROJECT}" ps
                        docker compose --env-file "${RESOLVED_PROD_ENV_FILE}" -f docker-compose.prod.yml -p "${PROD_PROJECT}" logs --tail=160
                        exit 1
                    }

                    check_url frontend "http://127.0.0.1:${BDEN_FRONTEND_HOST_PORT}/health/"
                    check_url auth "http://127.0.0.1:${BDEN_GATEWAY_HOST_PORT}/health/auth/"
                    check_url donor "http://127.0.0.1:${BDEN_GATEWAY_HOST_PORT}/health/donor/"
                    check_url request "http://127.0.0.1:${BDEN_GATEWAY_HOST_PORT}/health/request/"
                    check_url campaign "http://127.0.0.1:${BDEN_GATEWAY_HOST_PORT}/health/campaign/"
                    check_url notification "http://127.0.0.1:${BDEN_GATEWAY_HOST_PORT}/health/notification/"
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
