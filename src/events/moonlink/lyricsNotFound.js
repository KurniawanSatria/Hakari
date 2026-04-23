// src/events/moonlink/lyricsNotFound.js - Handle when lyrics not found

const logger = require('../../structures/logger');

module.exports = {
  name: 'lyricsNotFound',
  register: (client) => {
    client.manager.on('lyricsNotFound', async (player, payload) => {
      try {
        if (!player || player.destroyed) return;
        
        const title = player.current?.title || 'Unknown';
        logger.info(`[lyricsNotFound] ${title} (${player.guildId})`);
        
        // Clean up stored data
        player.lyricsData = null;
        player.lyricsLines = null;
        
        // Optionally notify (commented out to keep clean)
        // const channel = client.channels?.cache.get(player.textChannelId);
        // if (channel) {
        //   channel.send(`🎵 No lyrics found for **${title}**`).catch(() => {});
        // }
        
      } catch (err) {
        logger.error(`[lyricsNotFound] ${err.message}`);
      }
    });
  }
};