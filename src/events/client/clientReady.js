const logger = require('../../structures/logger');

module.exports = {
    name: 'clientReady',
    execute: async (client) => {
        try {
            logger.info(`Logged in as ${client.user.tag.split('#')[0]}`);
        } catch (err) {
            logger.error(`in clientReady: ${err.message}`, { stack: err.stack });
        }
    }
};