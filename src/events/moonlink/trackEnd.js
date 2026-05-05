// src/events/moonlink/trackEnd.js - Track end event

const logger = require('../../structures/logger');

module.exports = {
  name: 'trackEnd',
  register: (client) => {
    client.manager.on('trackEnd', async (player, track, reason) => {
      try {
        // Clean up lyrics
        if (player.lyricsMsg) {
          player.lyricsMsg.delete().catch(() => { });
          player.lyricsMsg = null;
        }
        player.lyricsData = null;
        player.lyricsLines = null;
        player.HandleByLyrics = false;

        // Clean up track message
        const playerMsg = global.db.data.guilds[player.guildId].message;
        if (playerMsg?.id && playerMsg?.channelId) {
          const oldChannel = client.channels?.cache.get(playerMsg.channelId);
          if (oldChannel) {
            const oldMsg = await oldChannel.messages.fetch(playerMsg.id).catch(() => null);
            if (oldMsg && oldMsg.deletable) {
              await oldMsg.delete().catch(() => null);
              global.db.data.guilds[player.guildId].message = null;
              await global.db.write();
            }
          }
        }


        const title = track.title || 'Unknown';
        const author = track.author || 'Unknown';
        const guildName = client.guilds?.cache.get(player.guildId)?.name || 'Unknown';
        const channelName = client.channels?.cache.get(player.textChannelId)?.name || 'Unknown';
        logger.info(`Finished playing ${title} by ${author} in ${guildName} (${channelName})`);

      } catch (err) {
        logger.error(`in trackEnd: ${err.message}`);
      }
    });
  }
};