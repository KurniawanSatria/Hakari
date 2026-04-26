const logger = require('../../structures/logger');

module.exports = {
  name: 'nodeError',
  register: (client) => {
    client.manager.on('nodeError', (node, error) => {
      logger.error(`in nodeError: Node ${node.identifier}: ${error.message}`);
    });
  }
};