require('dotenv').config();
const health = require('@cloudnative/health-connect');

const logger = require('./config/applogger');
var kc   = require('./config/k8s-config');

let healthcheck = require ('./services/HealthCheckService');
let watchService = require('./services/SecretWatchService');

let express    = require('express');        // call express
let app        = express();                 // define our app using express
const port = process.env.PORT || 3000;

var router = express.Router();
router.get('/', function(req, res) {
    res.json({ message: 'Welcome HaProxy cert-sync-client!' });
});
app.use('/api', router);

//health endpoints
app.use('/-/live', health.LivenessEndpoint(healthcheck.getHealthCheck()))
app.use('/-/ready', health.ReadinessEndpoint(healthcheck.getHealthCheck()))

app.listen(port);

logger.info('HaProxy cert-sync-client listening on '+ port)