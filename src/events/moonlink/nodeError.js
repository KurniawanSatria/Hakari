const logger = require('../../structures/logger');

/**
 * Attempts to transfer all players from a failed node to an available backup.
 * Uses moonlink.js v5 API: NodeManager.findNode(), PlayerManager.filter(), player.transferNode()
 */
async function failoverPlayers(client, failedNode, reason) {
  const manager = client.manager;

  // 1. Find a backup node (exclude the failed one)
  const backupNode = manager.nodes.findNode({ exclude: [failedNode.identifier] });

  if (!backupNode) {
    logger.error(`[Failover] No backup nodes available. Failed node: ${failedNode.identifier}`);
    return { transferred: 0, failed: 0, total: 0 };
  }

  logger.info(`[Failover] Using backup node: ${backupNode.identifier}`);

  // 2. Get all players on the failed node
  const affectedPlayers = manager.players.filter(
    player => !player.destroyed && player.node?.identifier === failedNode.identifier
  );

  if (affectedPlayers.length === 0) {
    logger.info('[Failover] No active players to transfer');
    return { transferred: 0, failed: 0, total: 0 };
  }

  logger.warn(`[Failover] ${affectedPlayers.length} player(s) affected by ${failedNode.identifier} failure`);

  // 3. Transfer each player with retry
  let transferred = 0;
  let failed = 0;

  for (const player of affectedPlayers) {
    let success = false;

    // Retry up to 3 times with backoff
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await player.transferNode(backupNode);
        transferred++;
        success = true;

        const guildName = client.guilds?.cache.get(player.guildId)?.name || player.guildId;
        logger.info(`[Failover] ✅ Transferred player in "${guildName}" to ${backupNode.identifier} (attempt ${attempt})`);

        // Notify the text channel
        try {
          const channel = client.channels?.cache.get(player.textChannelId);
          if (channel?.send) {
            await channel.send({
              content: `⚠️ Server musik terjadi masalah, otomatis pindah ke server cadangan. Musik tetap berjalan!`
            }).catch(() => {});
          }
        } catch (_) {}

        break; // Success, stop retrying
      } catch (err) {
        logger.warn(`[Failover] Attempt ${attempt}/3 failed for guild ${player.guildId}: ${err.message}`);

        if (attempt < 3) {
          // Exponential backoff: 1s, 2s
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
      }
    }

    if (!success) {
      failed++;
      logger.error(`[Failover] ❌ Failed to transfer player in guild ${player.guildId} after 3 attempts`);

      // Notify user about failure
      try {
        const channel = client.channels?.cache.get(player.textChannelId);
        if (channel?.send) {
          await channel.send({
            content: `❌ Server musik tidak tersedia. Silakan gunakan perintah play lagi.`
          }).catch(() => {});
        }
      } catch (_) {}
    }
  }

  logger.info(`[Failover] Complete: ${transferred} transferred, ${failed} failed, ${affectedPlayers.length} total`);
  return { transferred, failed, total: affectedPlayers.length };
}

module.exports = {
  name: 'nodeError',
  register: (client) => {
    client.manager.on('nodeError', async (node, error) => {
      logger.error(`Node ${node.identifier} error: ${error.message}`);
      await failoverPlayers(client, node, `error: ${error.message}`);
    });
  }
};