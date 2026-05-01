// src/events/moonlink/trackEnd.js - Track end event

const logger = require('../../structures/logger');
const { getPlayerMsg, removePlayerMsg } = require('../../structures/db');

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
        if (player.msg?.delete) {
          player.msg.delete().catch(() => { });
        }
        
        try {
          const oldMsgData = await getPlayerMsg(player.guildId);
          if (oldMsgData && oldMsgData.msgId && oldMsgData.channelId) {
            if (!player.msg || player.msg.id !== oldMsgData.msgId) {
              const oldChannel = client.channels?.cache.get(oldMsgData.channelId);
              if (oldChannel) {
                const oldMsg = await oldChannel.messages.fetch(oldMsgData.msgId).catch(() => null);
                if (oldMsg && oldMsg.deletable) {
                  await oldMsg.delete().catch(() => null);
                }
              }
            }
          }
          await removePlayerMsg(player.guildId);
        } catch (dbErr) {
          logger.warn(`trackEnd: Failed to delete previous message from DB: ${dbErr.message}`);
        }
        player.msg = null;

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