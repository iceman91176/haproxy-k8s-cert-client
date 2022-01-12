const formatters = {
    level (label, number) {
      return { level: number }
    }
}
const ecsFormat = require('@elastic/ecs-pino-format')()
//const logger = require('pino')({formatters:formatters})
const pino = require('pino');
const logger = pino(({ ...ecsFormat }));
logger.info("Logger initialized");

module.exports = logger;