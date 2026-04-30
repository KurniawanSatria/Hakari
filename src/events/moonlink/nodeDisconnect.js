const logger = require('../../structures/logger');

/**
 * Attempts to transfer all players from a disconnected node to an available backup.
 * Same failover logic as nodeError but triggered by disconnect events.
 */
async function failoverPlayers(client, failedNode, reason) {
  const manager = client.manager;

  const backupNode = manager.nodes.findNode({ exclude: [failedNode.identifier] });

  if (!backupNode) {
    logger.error(`[Failover] No backup nodes available after disconnect of ${failedNode.identifier}`);
    return;
  }

  const affectedPlayers = manager.players.filter(
    player => !player.destroyed && player.node?.identifier === failedNode.identifier
  );

  if (affectedPlayers.length === 0) {
    logger.info(`[Failover] Node ${failedNode.identifier} disconnected but no active players affected`);
    return;
  }

  logger.warn(`[Failover] Node ${failedNode.identifier} disconnected. Transferring ${affectedPlayers.length} player(s)...`);

  let transferred = 0;
  let failed = 0;

  for (const player of affectedPlayers) {
    let success = false;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await player.transferNode(backupNode);
        transferred++;
        success = true;

        const guildName = client.guilds?.cache.get(player.guildId)?.name || player.guildId;
        logger.info(`[Failover] ✅ Transferred player "${guildName}" → ${backupNode.identifier} (attempt ${attempt})`);

        try {
          const channel = client.channels?.cache.get(player.textChannelId);
          if (channel?.send) {
            await channel.send({
              content: `⚠️ Server musik terputus, otomatis pindah ke server cadangan. Musik tetap berjalan!`
            }).catch(() => {});
          }
        } catch (_) {}

        break;
      } catch (err) {
        logger.warn(`[Failover] Attempt ${attempt}/3 failed for guild ${player.guildId}: ${err.message}`);
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
      }
    }

    if (!success) {
      failed++;
      logger.error(`[Failover] ❌ Failed to transfer guild ${player.guildId} after 3 attempts`);

      try {
        const channel = client.channels?.cache.get(player.textChannelId);
        if (channel?.send) {
          await channel.send({
            content: `❌ Server musik terputus dan tidak bisa dipindahkan. Silakan gunakan perintah play lagi.`
          }).catch(() => {});
        }
      } catch (_) {}
    }
  }

  logger.info(`[Failover] Disconnect recovery: ${transferred}/${affectedPlayers.length} transferred, ${failed} failed`);
}

module.exports = {
  name: 'nodeDisconnect',
  register: (client) => {
    client.manager.on('nodeDisconnect', async (node, reason) => {
      logger.warn(`Node ${node.identifier} disconnected: ${reason}`);

      // Wait a moment to let moonlink.js attempt its own reconnect first
      // If after 5 seconds the node is still not connected, do failover
      setTimeout(async () => {
        try {
          // Check if node reconnected on its own
          if (node.connected) {
            logger.info(`[Failover] Node ${node.identifier} reconnected on its own, no failover needed`);
            return;
          }

          await failoverPlayers(client, node, reason);
        } catch (err) {
          logger.error(`[Failover] Disconnect handler error: ${err.message}`, { stack: err.stack });
        }
      }, 5000);
    });
  }
};
