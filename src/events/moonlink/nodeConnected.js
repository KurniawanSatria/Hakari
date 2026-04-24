const logger = require('../../structures/logger');

module.exports = {
name: 'nodeConnected',
register: (client) => {
  client.manager.on('nodeConnected', (node) => {
    console.log(`Connected: ${node.identifier}`);
  });
  }
};