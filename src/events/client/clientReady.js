// src/events/client/ready.js - Client ready event

const logger = require('../../structures/logger');

module.exports = {
  name: 'clientReady',
  execute: async (client) => {
    try {
      logger.info(`Logged in as ${client.user.tag}`);
      logger.info(`Serving ${client.guilds.cache.size} servers`);
      
      // Manager is already initialized in index.js
      // Just log status
      if (client.manager?.initialized) {
        logger.info('Moonlink manager already ready');
      }
      
    } catch (err) {
      logger.error(`[ready] ${err.message}`, { stack: err.stack });
    }
  }
};