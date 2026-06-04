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
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                sh 'git remote -v'
                sh 'git rev-parse --abbrev-ref HEAD'
            }
        }

        stage('Compose Validation') {
            steps {
                sh 'docker compose --env-file ${CI_ENV_FILE} -p ${CI_PROJECT} config --quiet'
                sh 'docker compose --env-file ${CI_ENV_FILE} -f docker-compose.prod.yml -p ${PROD_PROJECT} config --quiet'
            }
        }

        stage('Backend Syntax Checks') {
            steps {
                sh 'python3 -m compileall services/auth-service services/donor-service services/request-service services/campaign-service services/notification-service'
            }
        }

        stage('Build CI Images') {
            steps {
                sh 'docker compose --env-file ${CI_ENV_FILE} -p ${CI_PROJECT} build auth-service donor-service request-service campaign-service notification-service'
            }
        }

        stage('Django Checks') {
            steps {
                sh 'docker compose --env-file ${CI_ENV_FILE} -p ${CI_PROJECT} run --rm auth-service python manage.py check'
                sh 'docker compose --env-file ${CI_ENV_FILE} -p ${CI_PROJECT} run --rm donor-service python manage.py check'
                sh 'docker compose --env-file ${CI_ENV_FILE} -p ${CI_PROJECT} run --rm request-service python manage.py check'
                sh 'docker compose --env-file ${CI_ENV_FILE} -p ${CI_PROJECT} run --rm campaign-service python manage.py check'
                sh 'docker compose --env-file ${CI_ENV_FILE} -p ${CI_PROJECT} run --rm notification-service python manage.py check'
            }
        }

        stage('Django Tests') {
            steps {
                sh 'docker compose --env-file ${CI_ENV_FILE} -p ${CI_PROJECT} run --rm auth-service pytest'
                sh 'docker compose --env-file ${CI_ENV_FILE} -p ${CI_PROJECT} run --rm donor-service pytest'
                sh 'docker compose --env-file ${CI_ENV_FILE} -p ${CI_PROJECT} run --rm request-service pytest'
                sh 'docker compose --env-file ${CI_ENV_FILE} -p ${CI_PROJECT} run --rm campaign-service pytest'
                sh 'docker compose --env-file ${CI_ENV_FILE} -p ${CI_PROJECT} run --rm notification-service pytest'
            }
        }

        stage('Frontend Build') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                    sh 'npm run lint'
                    sh 'npm run build'
                }
            }
        }

        stage('Build Production Images') {
            when {
                anyOf {
                    branch 'main'
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
                    branch 'main'
                    expression { return params.DEPLOY_PROD }
                }
            }
            steps {
                sh 'test -f ${PROD_ENV_FILE}'
                sh 'docker compose --env-file ${PROD_ENV_FILE} -f docker-compose.prod.yml -p ${PROD_PROJECT} config --quiet'
                sh 'docker compose --env-file ${PROD_ENV_FILE} -f docker-compose.prod.yml -p ${PROD_PROJECT} build'
                sh 'docker compose --env-file ${PROD_ENV_FILE} -f docker-compose.prod.yml -p ${PROD_PROJECT} up -d --remove-orphans'
                sh 'curl -fsS http://127.0.0.1:${BDEN_FRONTEND_HOST_PORT}/health/'
                sh 'curl -fsS http://127.0.0.1:${BDEN_GATEWAY_HOST_PORT}/health/auth/'
                sh 'curl -fsS http://127.0.0.1:${BDEN_GATEWAY_HOST_PORT}/health/donor/'
                sh 'curl -fsS http://127.0.0.1:${BDEN_GATEWAY_HOST_PORT}/health/request/'
                sh 'curl -fsS http://127.0.0.1:${BDEN_GATEWAY_HOST_PORT}/health/campaign/'
                sh 'curl -fsS http://127.0.0.1:${BDEN_GATEWAY_HOST_PORT}/health/notification/'
            }
        }
    }

    post {
        always {
            sh 'docker compose --env-file ${CI_ENV_FILE} -p ${CI_PROJECT} down --remove-orphans -v'
        }
    }
}
