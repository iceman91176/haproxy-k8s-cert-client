require('dotenv').config();
const { t } = require('typy');
const k8s = require('@kubernetes/client-node');
const logger = require('../config/applogger');
const certService = require('./CertificateService');
var kc   = require('../config/k8s-config');


class SecretWatchService {

    constructor(){

        this.namespace = process.env.K8S_NAMESPACE;
        this.secretName = process.env.CERT_SECRET;
        this.resourceVersion = null;

        let k8sApi = kc.makeApiClient(k8s.CoreV1Api);

        let path = '/api/v1/namespaces/'+this.namespace+'/secrets';
        let watch = new k8s.Watch(kc);
        
        //const listFn = () => k8sApi.listNamespacedSecret(this.namespace);
        const listFn = () => k8sApi.listNamespacedSecret(this.namespace,"true",undefined,undefined,"metadata.name="+this.secretName);
        
        let informer = k8s.makeInformer(kc,path,listFn);
        informer.on('add', (obj) => { this.processInformEvent("ADD",obj) });
        informer.on('update', (obj) => { this.processInformEvent("UPDATE",obj) });
        informer.on('error', (err) => {
            logger.error(err);
            // Restart informer after 5sec
            setTimeout(() => {
                informer.start();
            }, 5000);
        });
        informer.start().then(() => {
            logger.info('Initialized watching ' + this.namespace+"/"+this.secretName + " for changes");
        });

    }

    processInformEvent(event,object){

        //logger.info(event + "  " + object.metadata.name);

        if (object.metadata.name == this.secretName ){
            //logger.info(object.metadata.resourceVersion + " vs " + this.resourceVersion);

            if (this.resourceVersion != object.metadata.resourceVersion){
                this.resourceVersion = object.metadata.resourceVersion;

                if (t(object,'data').isDefined){
                    if ( (object.data.hasOwnProperty('tls.key') ) && (object.data.hasOwnProperty('tls.crt') )) {
                        //decode cert data from base64
                        certService.updateCertificate(this.decodeCertData(object.data['tls.crt']),this.decodeCertData(object.data['tls.key']));
                    }
                }
            }
        }
    }

    decodeCertData(data){

        let buff = Buffer.from(data, 'base64');
        let str = buff.toString('utf-8');
        //console.log(str);
        return str;

    }

}

module.exports = new SecretWatchService();