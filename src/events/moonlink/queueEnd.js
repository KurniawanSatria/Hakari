// src/events/moonlink/queueEnd.js - Handle queue end with autoPlay

const logger = require('../../structures/logger');

module.exports = {
  name: 'queueEnd',
  register: (client) => {
    client.manager.on('queueEnd', async (player, lastTrack) => {
      try {
        if (!player || player.destroyed) return;
        
        const guildId = player.guildId;
        
        logger.info(`[queueEnd] Queue ended for guild ${guildId}`);
        
        // Check autoPlay
        if (player.autoPlay && lastTrack) {
          logger.info(`[queueEnd] Attempting autoplay for ${lastTrack.title}`);
          
          try {
            // Try NodeLink autoPlay
            const node = client.manager?.node;
            if (node?.handleAutoPlay) {
              await node.handleAutoPlay(player, lastTrack);
              logger.info(`[queueEnd] Autoplay triggered`);
            } else {
              // Fallback: search for similar track
              const query = `${lastTrack.author} ${lastTrack.title}`;
              const result = await client.manager.search({ 
                query, 
                requester: lastTrack.requester 
              });
              
              if (result?.tracks?.length > 0) {
                const nextTrack = result.tracks[0];
                nextTrack.setRequester?.(lastTrack.requester) || (nextTrack.requester = lastTrack.requester);
                player.queue.add(nextTrack);
                player.play();
                logger.info(`[queueEnd] Added autoplay track: ${nextTrack.title}`);
              }
            }
          } catch (e) {
            logger.error(`[queueEnd] Autoplay failed: ${e.message}`);
          }
        }
        
        // Don't destroy yet - wait for autoPlay or timeout
        const config = require('../../structures/config');
        
        // Set timeout to destroy if no new track
        setTimeout(() => {
          if (player && !player.destroyed && !player.playing && player.queue.size === 0) {
            logger.info(`[queueEnd] No new tracks, destroying player`);
            player.destroy('queue empty');
          }
        }, config.cleanTimeout || 15000);
        
      } catch (err) {
        logger.error(`[queueEnd] ${err.message}`);
      }
    });
  }
};