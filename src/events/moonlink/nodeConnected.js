const logger = require('../../structures/logger');

module.exports = {
name: 'nodeConnected',
register: (client) => {
  client.manager.on('nodeConnected', (node) => {
    logger.info(`Connected To node ${node.identifier}`);
  });
  }
};