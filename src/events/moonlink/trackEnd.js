// src/events/moonlink/trackEnd.js - Track end event

const logger = require('../../structures/logger');

module.exports = {
  name: 'trackEnd',
  register: (client) => {
    client.manager.on('trackEnd', async (player, track, reason) => {
      try {
        // Clean up lyrics
        if (player.lyricsMsg) {
          player.lyricsMsg.delete().catch(() => {});
          player.lyricsMsg = null;
        }
        player.lyricsData = null;
        player.lyricsLines = null;
        
        // Clean up track message
        if (player.msg?.delete) {
          player.msg.delete().catch(() => {});
        }
        player.msg = null;
        
        const title = track?.title || 'Unknown';
        logger.info(`[trackEnd] ${title} (${reason})`);
        
      } catch (err) {
        logger.error(`[trackEnd] ${err.message}`);
      }
    });
  }
};