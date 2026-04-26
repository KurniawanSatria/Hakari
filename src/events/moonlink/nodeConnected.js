const logger = require('../../structures/logger');

module.exports = {
name: 'nodeConnected',
register: (client) => {
  client.manager.on('nodeConnected', (node) => {
    logger.info(`✅ Connected to node: ${node.identifier}`);
    
    // Log all available nodes for debugging
    try {
      // Access nodes through the NodeManager
      const nodeManager = client.manager.nodes;
      const allNodes = nodeManager instanceof Map 
        ? Array.from(nodeManager.values()) 
        : (nodeManager.ready || []);
      
      // Log detailed node info for debugging
      allNodes.forEach(n => {
        logger.debug(`Node ${n.identifier}: connected=${n.connected}, stats=${n.stats ? 'yes' : 'no'}`);
      });
      
      // Use NodeManager properties
      const hasOnline = client.manager.nodes.hasOnlineNodes;
      const hasReady = client.manager.nodes.hasReady;
      const onlineCount = client.manager.nodes.online?.length || 0;
      const readyCount = client.manager.nodes.ready?.length || 0;
      
      logger.info(`Nodes status - Online: ${onlineCount}, Ready: ${readyCount}, HasOnline: ${hasOnline}, HasReady: ${hasReady}`);
      
      const connectedNodes = allNodes.filter(n => n.connected === true);
      if (connectedNodes.length > 0) {
        logger.info(`Active nodes: ${connectedNodes.map(n => n.identifier).join(', ')}`);
      }
    } catch (err) {
      logger.debug(`nodeConnected: Could not list all nodes: ${err.message}`);
    }
  });
  }
};