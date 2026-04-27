const logger = require('../../structures/logger');

module.exports = {
  name: 'nodeError',
  register: (client) => {
    client.manager.on('nodeError', async (node, error) => {
      logger.error(`Node ${node.identifier} error: ${error.message}`);
      
      // Try to transfer all players to backup nodes
      try {
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
        logger.info(`Attempting to transfer players to backup node: ${backupNode.identifier}`);

        // Get all players using PlayerManager API
        // Players might be stored differently in v5
        let playersToTransfer = [];
        try {
          const playerManager = client.manager.players;
          
          // Try different methods to get players
          if (playerManager instanceof Map) {
            playersToTransfer = Array.from(playerManager.values());
          } else if (playerManager.players instanceof Map) {
            playersToTransfer = Array.from(playerManager.players.values());
          } else if (Array.isArray(playerManager)) {
            playersToTransfer = playerManager;
          } else if (typeof playerManager.forEach === 'function') {
            playerManager.forEach(player => playersToTransfer.push(player));
          }
          
          logger.debug(`Found ${playersToTransfer.length} players to potentially transfer`);
        } catch (err) {
          logger.debug(`nodeError: Could not access players: ${err.message}`);
        }

        if (playersToTransfer.length === 0) {
          logger.debug('No active players to transfer');
          return;
        }

        // Transfer each player to backup node
        let transferredCount = 0;
        for (const player of playersToTransfer) {
          try {
            if (player && !player.destroyed && player.node?.identifier === node.identifier) {
              await player.transferNode(backupNode);
              transferredCount++;
              logger.info(`Successfully transferred player from guild ${player.guildId} to ${backupNode.identifier}`);
            }
          } catch (transferError) {
            logger.error(`Failed to transfer player ${player.guildId}: ${transferError.message}`);
            // Continue with next player even if one fails
          }
        }

        logger.info(`Failover complete. Transferred ${transferredCount} player(s) to ${backupNode.identifier}`);
      } catch (err) {
        logger.error(`Failover error: ${err.message}`, { stack: err.stack });
      }
    });
  }
};