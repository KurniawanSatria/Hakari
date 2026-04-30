const logger = require('../../structures/logger');
const guildDB = require('../../structures/guildDB');
const { hakariPlayerCard, playbackButtons } = require('../../structures/builders');
const { EMOJIS } = require('../../structures/emojis');

function msToTime(ms) {
  if (!ms || ms < 0) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
}

function buildProgressBar(current = 0, total = 0, length = 12) {
  if (!total || total <= 0) return '●───────────────────';
  const filled = Math.round((current / total) * length);
  const empty = length - filled;
  return '▬'.repeat(Math.max(filled - 1, 0)) + EMOJIS.progressbar.dot + '─'.repeat(Math.max(empty, 0));
}

module.exports = {
  name: 'trackStart',
  register: (client) => {
    client.manager.on('trackStart', async (player, track) => {
      try {
        // Validate player and track
        if (!player || player.destroyed) {
          logger.debug('trackStart: Player destroyed or null');
          return;
        }

        if (!track) {
          logger.error('trackStart: No track provided');
          return;
        }

        // Reset all voting systems for new track
        try {
          player.skipVotes = new Set();
          player.stopVotes = new Set();
          player.previousVotes = new Set();
          player.pauseVotes = new Set();
        } catch (voteErr) {
          logger.error(`trackStart: Failed to reset votes: ${voteErr.message}`);
        }

        // Safely get text channel
        const guildSettings = guildDB.getGuild(player.guildId);
        let channel = client.channels?.cache.get(player.textChannelId);
        
        if (guildSettings.announceChannelId) {
          const announceChannel = client.channels?.cache.get(guildSettings.announceChannelId);
          if (announceChannel) {
            channel = announceChannel;
          }
        }
        
        if (!channel) {
          logger.warn(`trackStart: Text channel ${player.textChannelId} not found for guild ${player.guildId}`);
          return;
        }

        // // Subscribe to lyrics (non-blocking)
        // try {
        //   player.subscribeLyrics().catch((lyricsErr) => {
        //     logger.warn(`trackStart: Failed to subscribe to lyrics: ${lyricsErr.message}`);
        //   });
        // } catch (lyricsErr) {
        //   logger.warn(`trackStart: Failed to subscribe to lyrics: ${lyricsErr.message}`);
        // }

        // Delete previous track message safely
        if (player.msg?.delete) {
          player.msg.delete().catch((err) => {
            logger.debug(`trackStart: Failed to delete previous message: ${err.message}`);
          });
        }

        // Clean up queue messages safely
        if (player.queueMsgs && player.queueMsgs.length > 0) {
          const msgsToDelete = [...player.queueMsgs];
          player.queueMsgs = [];

          for (const msg of msgsToDelete) {
            if (msg?.delete) {
              msg.delete().catch((err) => {
                logger.debug(`trackStart: Failed to delete queue message: ${err.message}`);
              });
            }
          }
        }

        // Safely extract track info with fallbacks
        const title = track.title ? track.title.slice(0, 32) : 'Unknown';
        const author = track.author || 'Unknown';
        const thumb = track.thumbnail || 'https://files.catbox.moe/fnlch5.jpg';
        const duration = track.duration ? msToTime(track.duration) : '0:00';
        const requester = track.requester?.username || 'Unknown';
        const queueSize = player.queue?.size ?? player.queue?.length ?? 0;
        const progressBar = buildProgressBar(0, track.duration ?? 0);

        // Log with safe guild/channel name access
        const guildName = channel.guild?.name || 'Unknown';
        const channelName = channel.name || 'Unknown';
        logger.info(`Playing: ${title} by ${author} in ${channelName} (${guildName})`);

        const queueText = queueSize > 0 ? `${queueSize} song${queueSize !== 1 ? 's' : ''} in queue` : 'No songs in queue';
        const sectionContent = [
          `### ${EMOJIS.bot.hakariAnimated} Now Playing`,
          `**[${title}](${track.uri || '#'})**`,
          `${author} — \`${duration}\``,
        ].join('\n');
        const bodyContent = [
          `${progressBar}`,
          `-# ${queueText}`
        ].join('\n');

        // Send message with error handling
        const sent = await channel.send(hakariPlayerCard({
          sectionContent,
          bodyContent,
          thumbnailURL: thumb,
        })).catch(e => {
          logger.error(`trackStart: Failed to send now playing message: ${e.message}`, { stack: e.stack });
          return null;
        });

        if (sent) {
          player.msg = sent;
          logger.debug('trackStart: Now playing message sent successfully');
        } else {
          logger.warn('trackStart: Could not send now playing message');
        }

      } catch (err) {
        logger.error(`trackStart handler error: ${err.message}`, { stack: err.stack });
      }
    });
  }
};