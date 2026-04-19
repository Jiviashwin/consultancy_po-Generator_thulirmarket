// ============================================================
// Jenkinsfile — PO Generator CI/CD Pipeline
// ============================================================
// Required Jenkins Credentials (configure in Jenkins → Credentials):
//   ghcr-credentials  → Username/Password
//                        username: your GitHub username
//                        password: GitHub Personal Access Token (with write:packages scope)
//
//   kubeconfig        → Secret File → your ~/.kube/config
// ============================================================

pipeline {
    agent any

    // ── Pipeline-level environment ────────────────────────────
    environment {
        // GitHub Container Registry
        REGISTRY        = "ghcr.io"
        GITHUB_USERNAME = "Jiviashwin"

        BACKEND_IMAGE   = "${REGISTRY}/${GITHUB_USERNAME}/po-generator-backend"
        FRONTEND_IMAGE  = "${REGISTRY}/${GITHUB_USERNAME}/po-generator-frontend"

        // Tag every build with the short Git commit SHA + build number
        IMAGE_TAG       = "${env.BUILD_NUMBER}-${env.GIT_COMMIT?.take(7) ?: 'local'}"

        // K8s namespace
        K8S_NAMESPACE   = "po-generator"
    }

    options {
        // Keep last 10 builds only
        buildDiscarder(logRotator(numToKeepStr: '10'))
        // Fail the build if it takes more than 30 minutes
        timeout(time: 30, unit: 'MINUTES')
        // Don't run concurrent builds on the same branch
        disableConcurrentBuilds()
        timestamps()
    }

    stages {
        // ── Stage 1: Checkout ─────────────────────────────────
        stage('Checkout') {
            steps {
                echo "📥 Checking out source code..."
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(
                        script: "git rev-parse --short HEAD",
                        returnStdout: true
                    ).trim()
                    env.IMAGE_TAG = "${env.BUILD_NUMBER}-${env.GIT_COMMIT_SHORT}"
                    echo "🔖 Image tag: ${env.IMAGE_TAG}"
                }
            }
        }

        // ── Stage 2: Install & Lint ───────────────────────────
        stage('Install & Lint') {
            parallel {
                stage('Backend — Install') {
                    steps {
                        dir('backend') {
                            echo "📦 Installing backend dependencies..."
                            sh 'npm ci'
                        }
                    }
                }
                stage('Frontend — Install') {
                    steps {
                        dir('frontend') {
                            echo "📦 Installing frontend dependencies..."
                            sh 'npm ci'
                        }
                    }
                }
            }
        }

        // ── Stage 3: Test ─────────────────────────────────────
        stage('Test') {
            parallel {
                stage('Backend — Test') {
                    steps {
                        dir('backend') {
                            echo "🧪 Running backend tests..."
                            // Add: npm test
                            // Placeholder — remove the echo once tests exist
                            sh 'echo "No backend tests configured yet — skipping"'
                        }
                    }
                }
                stage('Frontend — Build Check') {
                    steps {
                        dir('frontend') {
                            echo "🏗️  Verifying frontend build..."
                            sh 'VITE_API_URL=/api npm run build'
                        }
                    }
                }
            }
        }

        // ── Stage 4: Build Docker Images ──────────────────────
        stage('Build Docker Images') {
            parallel {
                stage('Build Backend Image') {
                    steps {
                        dir('backend') {
                            echo "🐳 Building backend Docker image..."
                            sh """
                                docker build \
                                  --tag ${BACKEND_IMAGE}:${IMAGE_TAG} \
                                  --tag ${BACKEND_IMAGE}:latest \
                                  --cache-from ${BACKEND_IMAGE}:latest \
                                  .
                            """
                        }
                    }
                }
                stage('Build Frontend Image') {
                    steps {
                        dir('frontend') {
                            echo "🐳 Building frontend Docker image..."
                            sh """
                                docker build \
                                  --tag ${FRONTEND_IMAGE}:${IMAGE_TAG} \
                                  --tag ${FRONTEND_IMAGE}:latest \
                                  --cache-from ${FRONTEND_IMAGE}:latest \
                                  .
                            """
                        }
                    }
                }
            }
        }

        // ── Stage 5: Push to GHCR ─────────────────────────────
        stage('Push to GHCR') {
            steps {
                echo "🚀 Pushing images to GitHub Container Registry..."
                withCredentials([usernamePassword(
                    credentialsId: 'ghcr-credentials',
                    usernameVariable: 'GHCR_USER',
                    passwordVariable: 'GHCR_TOKEN'
                )]) {
                    sh """
                        echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_USER}" --password-stdin

                        docker push ${BACKEND_IMAGE}:${IMAGE_TAG}
                        docker push ${BACKEND_IMAGE}:latest

                        docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}
                        docker push ${FRONTEND_IMAGE}:latest

                        docker logout ghcr.io
                    """
                }
            }
        }

        // ── Stage 6: Deploy to Kubernetes ─────────────────────
        stage('Deploy to Kubernetes') {
            steps {
                echo "☸️  Deploying to Kubernetes (Minikube)..."
                withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG_FILE')]) {
                    sh """
                        export KUBECONFIG=${KUBECONFIG_FILE}

                        # Apply all manifests (namespace first, then rest)
                        kubectl apply -f k8s/namespace.yaml
                        kubectl apply -f k8s/configmap.yaml
                        kubectl apply -f k8s/secrets.yaml
                        kubectl apply -f k8s/uploads-pvc.yaml
                        kubectl apply -f k8s/backend-service.yaml
                        kubectl apply -f k8s/frontend-service.yaml
                        kubectl apply -f k8s/backend-deployment.yaml
                        kubectl apply -f k8s/frontend-deployment.yaml
                        kubectl apply -f k8s/ingress.yaml

                        # Rolling update — set the new image tag
                        kubectl set image deployment/backend \
                          backend=${BACKEND_IMAGE}:${IMAGE_TAG} \
                          -n ${K8S_NAMESPACE}

                        kubectl set image deployment/frontend \
                          frontend=${FRONTEND_IMAGE}:${IMAGE_TAG} \
                          -n ${K8S_NAMESPACE}

                        # Wait for rollout to complete
                        kubectl rollout status deployment/backend  -n ${K8S_NAMESPACE} --timeout=120s
                        kubectl rollout status deployment/frontend -n ${K8S_NAMESPACE} --timeout=120s

                        echo "✅ Deployment complete!"
                        kubectl get pods -n ${K8S_NAMESPACE}
                    """
                }
            }
        }
    } // end stages

    // ── Post-build actions ────────────────────────────────────
    post {
        always {
            echo "🧹 Cleaning up local Docker images..."
            sh """
                docker rmi ${BACKEND_IMAGE}:${IMAGE_TAG}  || true
                docker rmi ${FRONTEND_IMAGE}:${IMAGE_TAG} || true
            """
        }
        success {
            echo "✅ Pipeline succeeded! Build #${env.BUILD_NUMBER} deployed."
        }
        failure {
            echo "❌ Pipeline failed. Check the logs above for details."
        }
    }
}
