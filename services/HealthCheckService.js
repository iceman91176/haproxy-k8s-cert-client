const health = require('@cloudnative/health');
const logger = require('../config/applogger');
const k8s = require('@kubernetes/client-node');
const kc   = require('../config/k8s-config');


class HealtchCheckService {
    
    constructor(){
        this.healthcheck = new health.HealthChecker();
        this.namespace = process.env.K8S_NAMESPACE;

        this.registerK8SCheck();

    }

    registerK8SCheck(){

        const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
        let self = this;

        const livePromise = () => new Promise(function (resolve, reject) {

            let req = k8sApi.listNamespacedSecret(self.namespace).then((res => {
                logger.debug("K8S is alive");
                resolve();
            
            })).catch((err => {
                logger.warn("Unable to connecto to K8S");
                reject(new Error(`Failed to connecto to K8S: ${err}`));
            }));

        });

        let liveCheck = new health.LivenessCheck("k8sLiveCheck", livePromise);
        this.healthcheck.registerLivenessCheck(liveCheck);

        let readyCheck = new health.ReadinessCheck("k8sReadyCheck", livePromise);
        this.healthcheck.registerReadinessCheck(readyCheck);



    }

    getHealthCheck(){
        return this.healthcheck;
    }

}

module.exports = new HealtchCheckService();