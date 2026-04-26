const logger = require('../../structures/logger');
const { hakariPlayerCard, playbackButtons } = require('../../structures/builders');

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
  return '▬'.repeat(Math.max(filled - 1, 0)) + '<:dot:1498023441649897503>' + '─'.repeat(Math.max(empty, 0));
}

module.exports = {
  name: 'trackStart',
  register: (client) => {
    client.manager.on('trackStart', async (player, track) => {
      try {
        if (!player || player.destroyed) return;
        
        // Reset all voting systems for new track
        player.skipVotes = new Set();
        player.stopVotes = new Set();
        player.previousVotes = new Set();
        player.pauseVotes = new Set();

        const channel = client.channels?.cache.get(player.textChannelId);
        if (!channel) return;
        await player.subscribeLyrics()
        
        // Delete previous track message (Now Playing message)
        if (player.msg?.delete) {
          player.msg.delete().catch(() => { });
        }
        
        // Clean up queue messages - delete messages for tracks that have been played
        // Queue messages are added when tracks are queued, and should be deleted when track starts playing
        if (player.queueMsgs && player.queueMsgs.length > 0) {
          for (const msg of player.queueMsgs) {
            msg.delete().catch(() => { });
          }
          player.queueMsgs = [];
        }
        const title = track.title.slice(0, 32) || 'Unknown';
        const author = track.author || 'Unknown';
        const thumb = track.thumbnail || 'https://files.catbox.moe/fnlch5.jpg';
        const duration = track.duration ? msToTime(track.duration) : '0:00';
        const requester = track.requester?.username || 'Unknown';
        const queueSize = player.queue?.size ?? player.queue?.length ?? 0;
        const progressBar = buildProgressBar(0, track.duration ?? 0);
        
        logger.info(`playing: ${title} by ${author} in ${channel.name} ${channel.guild.name}`);
        const queueText = queueSize > 0 ? `${queueSize} song${queueSize !== 1 ? 's' : ''} in queue` : 'No songs in queue';
        const sectionContent = [
          `### <a:hakari:1497764150099574904> Now Playing`,
          `**[${title}](${track.uri})**`,
          `${track.author} — \`${duration}\``,
        ].join('\n');
        const bodyContent = [
          `${progressBar}`,
          `-# ${queueText}`
        ].join('\n');
        
        const sent = await channel.send(hakariPlayerCard({
          sectionContent,
          bodyContent,
          thumbnailURL: thumb,
        })).catch(e => {
          logger.error(`Send failed: ${e.message}`);
          return null;
        });

        if (sent) player.msg = sent;

      } catch (err) {
        logger.error(`trackStart error: ${err.message}`, { stack: err.stack });
      }
    });
  }
};