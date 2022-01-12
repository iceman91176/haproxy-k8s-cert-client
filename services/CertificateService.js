require('dotenv').config();
const fs = require('fs');
const logger = require('../config/applogger');

class CertificateService {

    constructor(){

        this.certificateFile=process.env.HAPROXY_CERTFILE;
        logger.info('Initialized cert-service');
    }

    updateCertificate(certificate,key){

        let pemContent=certificate+key;
        let self = this;
        fs.writeFile(this.certificateFile, pemContent, function (err) {
            if (err){
                logger.error("There was an error when updating the certificate-file " + self.certificateFile);
            } else {
                logger.info("Certificate file " + self.certificateFile + " has been updated");
            }
        }); 

    }
}

module.exports = new CertificateService();