// src/events/client/ready.js - Client ready event

const logger = require('../../structures/logger');

module.exports = {
  name: 'clientReady',
  execute: async (client) => {
    try {
      logger.info(`Logged in as ${client.user.tag}`);
      logger.info(`Serving ${client.guilds.cache.size} servers`);
      
      if (client.manager) {
        logger.info(`Manager type: ${client.manager.constructor?.name}`);
        logger.info(`Manager nodes type: ${client.manager.nodes?.constructor?.name}`);
        logger.info(`Manager has players: ${!!client.manager.players}`);
        
        // Try different paths to get node count
        const size1 = client.manager.nodes?.nodes?.size;
        const size2 = client.manager.nodes?.size;
        logger.info(`nodes.nodes.size = ${size1}, nodes.size = ${size2}`);
        
      } else {
        logger.error('Manager not initialized!');
      }
      
    } catch (err) {
      logger.error(`[ready] ${err.message}`, { stack: err.stack });
    }
  }
};