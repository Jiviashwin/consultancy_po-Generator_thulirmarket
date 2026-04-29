pipeline {
    agent any

    environment {
        APP_NAME = "consultancy-app"
        DOCKER_IMAGE = "consultancy-app"
    }

    stages {

        stage('Clone Repository') {
            steps {
                git branch: 'main',
                url: 'https://github.com/Jiviashwin/consultancy_po-Generator_thulirmarket.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t $DOCKER_IMAGE .'
            }
        }

        stage('Run Container') {
            steps {
                sh '''
                docker rm -f consultancy-container || true
                docker run -d --name consultancy-container -p 3000:3000 $DOCKER_IMAGE
                '''
            }
        }

        stage('Kubernetes Deploy') {
            steps {
                sh '''
                kubectl create deployment consultancy-app --image=$DOCKER_IMAGE --dry-run=client -o yaml | kubectl apply -f -
                kubectl expose deployment consultancy-app --type=NodePort --port=3000 --dry-run=client -o yaml | kubectl apply -f -
                '''
            }
        }
    }
}
