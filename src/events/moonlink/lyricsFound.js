// src/events/moonlink/lyricsFound.js - Handle when lyrics are found

const logger = require('../../structures/logger');

module.exports = {
  name: 'lyricsFound',
  register: (client) => {
    client.manager.on('lyricsFound', async (player, payload) => {
      try {
        if (!player || player.destroyed) return;
        const channel = client.channels?.cache.get(player.textChannelId);
        const track = player.current;
        const title = track?.title || 'Unknown';

        logger.info(`[lyricsFound] ${title} - ${payload?.lines?.length || 0} lines (${player.guildId})`);

        player.lyricsData = payload;
        player.lyricsLines = payload?.lines || [];
        player.current.lyrics_provider = payload.lyrics.provider || 'Unknown';
        if (player.pendingLyricsMsg) {
          let msg = await player.pendingLyricsMsg.edit({ flags: 32768, components: [{ type: 17, components: [{ type: 10, content: "**<:hakari:1482121759330275400> Hakari Music**" }, { type: 14, divider: true, spacing: 1 }, { type: 10, content: `Found lyrics for ${title} from ${player.current.lyrics_provider}` }], accent_color: 16687280 }] })
          setTimeout(() => {
            msg.delete().catch(() => { })
          }, 3000) 
        }
        logger.info(`Found lyrics for ${title} from ${player.current.lyrics_provider}`)

      } catch (err) {
        logger.error(`in lyricsFound: ${err.message}`);
      }
    });
  }
};