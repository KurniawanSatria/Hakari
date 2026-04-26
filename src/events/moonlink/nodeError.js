const logger = require('../../structures/logger');

module.exports = {
  name: 'nodeError',
  register: (client) => {
    client.manager.on('nodeError', async (node, error) => {
      logger.error(`Node ${node.identifier} error: ${error.message}`);
      
      // Try to transfer all players to backup nodes
      try {
        const players = client.manager.players;
        if (!players || players.size === 0) {
          logger.debug('No active players to transfer');
          return;
        }

        // Get available nodes using NodeManager API
        let availableNodes = [];
        try {
          // Get ready nodes from NodeManager
          const readyNodes = client.manager.nodes?.ready || [];
          availableNodes = readyNodes.filter(n => n.identifier !== node.identifier);
        } catch (err) {
          logger.debug(`nodeError: Could not access nodes: ${err.message}`);
        }

        if (availableNodes.length === 0) {
          logger.error('No backup nodes available for failover');
          return;
        }

        // Sort by priority (lower number = higher priority)
        availableNodes.sort((a, b) => (a.priority || 0) - (b.priority || 0));
        
        // Use the highest priority backup node
        const backupNode = availableNodes[0];
        logger.info(`Attempting to transfer ${players.size} player(s) to backup node: ${backupNode.identifier}`);

        // Transfer each player to backup node
        for (const player of players.values()) {
          try {
            if (player && !player.destroyed) {
              await player.transferNode(backupNode);
              logger.info(`Successfully transferred player from ${player.guildId} to ${backupNode.identifier}`);
            }
          } catch (transferError) {
            logger.error(`Failed to transfer player ${player.guildId}: ${transferError.message}`);
            // Continue with next player even if one fails
          }
        }

        logger.info(`Failover complete. Transferred players to ${backupNode.identifier}`);
      } catch (err) {
        logger.error(`Failover error: ${err.message}`, { stack: err.stack });
      }
    });
  }
};