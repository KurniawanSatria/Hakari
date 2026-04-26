const logger = require('../../structures/logger');

module.exports = {
    name: 'clientReady',
    execute: async (client) => {
        try {
            logger.started(`Logged in as ${client.user.tag.split('#')}`);
        } catch (err) {
            logger.error(`ready error: ${err.message}`, { stack: err.stack });
        }
    }
};