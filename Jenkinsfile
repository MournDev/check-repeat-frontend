// ========================================
// 前端 CI/CD 流水线（SSH 部署版）
//
// 触发：Gitee push -> Generic Webhook Trigger -> 本流水线
// 运行：Jenkins 容器（与目标服务器同一台物理机）
//
// 设计要点：
//   - Jenkins 容器【不挂载 docker.sock】，不具备任何 Docker 权限
//   - Jenkins 不安装 Node，也不执行构建：构建发生在宿主机上，
//     由 docker build 内部的 node:22-alpine 阶段完成
//   - Jenkins 只做一件事：经 SSH 触发宿主机上受 sudo 限制的部署脚本
//
// 安全边界：Jenkins 侧凭据是一把受限 SSH 私钥，
//   即便泄露，攻击者也只能触发「部署 master 上的某个提交」，
//   无法执行任意命令、无法读宿主机文件、无法开端口转发。
//
// 前置条件见 deploy/README.md「三、Jenkins 配置」
// ========================================

pipeline {
    agent any

    options {
        // 部署脚本自带 flock 互斥，此处再加一道，避免并发触发
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '20'))
        timeout(time: 20, unit: 'MINUTES')
    }

    environment {
        // 宿主机在 Jenkins 容器视角下的地址。
        // 默认 bridge 网络下通常是 172.17.0.1（即容器默认网关）。
        // 确认方法见 deploy/README.md 三.3。
        DEPLOY_HOST = '172.17.0.1'
        DEPLOY_USER = 'deploy'
        // 本机 known_hosts，固定路径避免 HOME 不确定
        KNOWN_HOSTS = '/var/jenkins_home/.ssh/known_hosts'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_SHA = sh(returnStdout: true, script: 'git rev-parse HEAD').trim()
                    env.SHORT_SHA = sh(returnStdout: true, script: 'git rev-parse --short=8 HEAD').trim()
                    echo "本次构建提交：${env.GIT_SHA}"
                }
            }
        }

        stage('Deploy') {
            steps {
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'deploy-frontend-ssh-key',
                        keyFileVariable: 'SSH_KEY',
                        usernameVariable: 'SSH_USERNAME'
                    )
                ]) {
                    // 宿主机上的脚本会重新 fetch 并按 SHA 校验提交是否在 origin/master 历史中，
                    // 因此这里传入 SHA 是安全的：即使被篡改也无法部署非 master 的提交。
                    sh '''
                        chmod 600 "$SSH_KEY"

                        ssh -i "$SSH_KEY" \
                            -o IdentitiesOnly=yes \
                            -o StrictHostKeyChecking=yes \
                            -o UserKnownHostsFile="$KNOWN_HOSTS" \
                            -o ConnectTimeout=15 \
                            -o BatchMode=yes \
                            "${DEPLOY_USER}@${DEPLOY_HOST}" \
                            "${GIT_SHA}"
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "✅ 部署成功，提交 ${env.SHORT_SHA} 已上线"
        }
        failure {
            echo "❌ 部署失败。宿主机上的脚本已尝试自动回滚，请查看上方输出确认回滚结果。"
        }
    }
}
