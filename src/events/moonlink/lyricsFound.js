// src/events/moonlink/lyricsFound.js - Handle when lyrics are found

const logger = require('../../structures/logger');

module.exports = {
  name: 'lyricsFound',
  register: (client) => {
    client.manager.on('lyricsFound', async (player, payload) => {
      try {
        if (!player || player.destroyed) return;
        
        const track = player.current;
        const title = track?.title || 'Unknown';
        
        logger.info(`[lyricsFound] ${title} - ${payload?.lines?.length || 0} lines (${player.guildId})`);
        
        player.lyricsData = payload;
        player.lyricsLines = payload?.lines || [];
        
        // No message sent - lyrics shown in now playing message
        // Updated via lyricsLine event
        
      } catch (err) {
        logger.error(`[lyricsFound] ${err.message}`);
      }
    });
  }
};