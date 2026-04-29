pipeline {
    agent any

    stages {

        stage('Clone Repository') {
            steps {
                git branch: 'main',
                url: 'https://github.com/Jiviashwin/consultancy_po-Generator_thulirmarket.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t thulir-app .'
            }
        }

        stage('Run Docker Container') {
            steps {
                sh 'docker stop thulir-app || true'
                sh 'docker rm thulir-app || true'
                sh 'docker run -d --name thulir-app -p 3000:3000 thulir-app'
            }
        }

        stage('Kubernetes Deploy') {
            steps {
                sh 'kubectl apply -f deployment.yaml'
                sh 'kubectl apply -f service.yaml'
            }
        }
    }
}
