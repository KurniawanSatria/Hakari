// src/events/moonlink/nodeError.js - Handle node errors

const logger = require('../../structures/logger');

module.exports = {
  name: 'nodeError',
  register: (client) => {
    client.manager.on('nodeError', (node, error) => {
      logger.error(`[node] ${node.identifier}: ${error.message}`, { 
        stack: error.stack 
      });
    });
  }
};