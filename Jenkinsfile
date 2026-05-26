pipeline {
    agent any

    options {
        timestamps()
        ansiColor('xterm')
        skipDefaultCheckout(false)
    }

    environment {
        COMPOSE_PROJECT_NAME = 'bden-ci'
        DJANGO_SETTINGS_MODULE = 'config.settings.dev'
        VITE_API_BASE_URL = 'http://localhost:8080'
        PORT_PREFIX = '1'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                sh 'git remote -v'
            }
        }

        stage('Backend Syntax Checks') {
            steps {
                sh 'python3 -m compileall services/auth-service services/donor-service services/request-service services/campaign-service services/notification-service'
            }
        }

        stage('Django Service Tests') {
            steps {
                sh 'docker compose run --rm auth-service pytest'
                sh 'docker compose run --rm donor-service pytest'
            }
        }

        stage('Frontend Build') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                    sh 'npm run build'
                }
            }
        }

        stage('Compose Validation') {
            steps {
                sh 'docker compose config --quiet'
            }
        }

        stage('Deploy Placeholder') {
            when {
                expression { return false }
            }
            steps {
                echo 'Deployment is intentionally disabled until the VPS/K3s target is ready.'
            }
        }
    }

    post {
        always {
            sh 'docker compose down --remove-orphans'
        }
    }
}
