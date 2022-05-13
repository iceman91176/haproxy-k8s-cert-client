require('dotenv').config();
const { t } = require('typy');
const k8s = require('@kubernetes/client-node');
const logger = require('../config/applogger');
const certService = require('./CertificateService');
var kc   = require('../config/k8s-config');


class SecretWatchService {

    constructor(){

        //default idle timeout is 30 minutes
        const defaultTimeout = 30 * 60 * 1000;
        this.namespace = process.env.K8S_NAMESPACE;
        this.secretName = process.env.CERT_SECRET;
        this.resourceVersion = null;
        this.idleTimeout = process.env.K8S_IDLE_TIMEOUT || defaultTimeout;
        this.timer = null;        

        let k8sApi = kc.makeApiClient(k8s.CoreV1Api);

        let path = '/api/v1/namespaces/'+this.namespace+'/secrets';

        const listFn = () => k8sApi.listNamespacedSecret(this.namespace,"true",undefined,undefined,"metadata.name="+this.secretName
            ,undefined,undefined,undefined,undefined,300
        );
        
        this.informer = k8s.makeInformer(kc,path,listFn);
        let self = this;
        this.informer.on('add', (obj) => { this.processInformEvent("ADD",obj) });
        this.informer.on('update', (obj) => { this.processInformEvent("UPDATE",obj) });
        this.informer.on('error', (err) => {
            if (err.hasOwnProperty('message')){
                if (err.message != 'aborted'){
                    logger.error(err);
                }                
            }
            // Restart informer after 5sec
            setTimeout(() => {
                logger.info("Restarting watcher"); 
                self._startWatcher();
            }, 5000);
        });
        this._startWatcher();
    }

    processInformEvent(event,object){
        if (object.metadata.name == this.secretName ){

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
        this._setIdleTimeout();
    }

    decodeCertData(data){

        let buff = Buffer.from(data, 'base64');
        let str = buff.toString('utf-8');
        //console.log(str);
        return str;

    }

    /**
     * This is not really working to well. Stopping the watcher aborts the session, which triggers
     * the error handler, which starts the informer again
     */
    _restartWatcher(){
        this.informer.stop().then(() => {
            logger.info('Watcher restart triggered after idle-timeout was reached');
        });
    }

    _startWatcher(){
        this.informer.start().then(() => {
            logger.info('Initialized watching ' + this.namespace+"/"+this.secretName + " for changes");
        });
        this._setIdleTimeout();
    }

    // Clear idle/restart timer.
    _clearTimer() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = undefined;
        }
    }

    _setIdleTimeout() {
        if (this.idleTimeout > 0) {
            //logger.info('Setting timeout to ' + this.idleTimeout);
            this._clearTimer();
            this.timer = setTimeout(() => {
                this._restartWatcher();
            }, this.idleTimeout);
        }
    }
        

}

module.exports = new SecretWatchService();