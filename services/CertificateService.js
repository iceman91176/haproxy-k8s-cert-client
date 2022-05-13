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
        let tmpFile = this.certificateFile + '$$$';
        
        try {
            //create temporary file with cert-pem-data.
            fs.writeFileSync(tmpFile, pemContent);
            let tmpBuf = fs.readFileSync(tmpFile);
            let pemBuf = Buffer.from("fake");
            if (fs.existsSync(this.certificateFile)) {
                pemBuf = fs.readFileSync(this.certificateFile);
            }
            //compare old and new file
            if (!tmpBuf.equals(pemBuf)) {
                logger.info("Certificate file " + self.certificateFile + " needs an update");
                //if not equal rename temp-file to original file
                fs.renameSync(tmpFile, this.certificateFile);
                logger.info("Certificate file " + self.certificateFile + " has been updated");
            } else {
                logger.info("Certificate file " + self.certificateFile + " does not need an update");
                fs.unlinkSync(tmpFile);
            }
        } catch (err) {
            logger.error("There was an error when updating the certificate-file " + self.certificateFile);
            logger.error(err);
        }

    }
}

module.exports = new CertificateService();