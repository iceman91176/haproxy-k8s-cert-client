require('dotenv').config();
const k8s = require('@kubernetes/client-node');

const logger = require('./applogger');
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

let cluster = {
    name: 'k8s01',
    //'certificate-authority-data':process.env.K8S_CA,
    server: process.env.K8S_SERVER,
};

let user = {
    name: process.env.K8S_SERVICEACCOUNT,
    token: process.env.K8S_TOKEN
};

let context = {
    name: 'my-context',
    user: user.name,
    cluster: cluster.name,
};

let kc = new k8s.KubeConfig();
kc.loadFromOptions({
    clusters: [cluster],
    users: [user],
    contexts: [context],
    currentContext: context.name,
});

logger.info('Configured K8S with cluster ' + cluster.server);

module.exports = kc;
