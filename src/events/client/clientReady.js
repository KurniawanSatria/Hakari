// src/events/client/ready.js - Client ready event

const logger = require('../../structures/logger');

module.exports = {
  name: 'clientReady',
  execute: async (client) => {
    try {
      logger.started(`Logged in as ${client.user.tag}`);
      logger.started(`Serving ${client.guilds.cache.size} servers`);
      
      if (client.manager) {
        const nodeMap = client.manager.nodes?.nodes;
        const nodeCount = nodeMap?.size || 0;
        
        if (nodeCount > 0) {
          for (const [id, node] of nodeMap) {
            logger.moonlink(`Node ${id}: ${node.connected ? 'connected' : 'disconnected'} (${node.host})`);
          }
        } else {
          logger.warn('No nodes configured!');
        }
      } else {
        logger.error('Manager not initialized!');
      }
      
    } catch (err) {
      logger.error(`ready error: ${err.message}`, { stack: err.stack });
    }
  }
};