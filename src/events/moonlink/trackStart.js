const logger = require('../../structures/logger');

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
  return '▬'.repeat(Math.max(filled - 1, 0)) + '🔘' + '─'.repeat(Math.max(empty, 0));
}

module.exports = {
  name: 'trackStart',
  register: (client) => {
    client.manager.on('trackStart', async (player, track) => {
      try {
        if (!player || player.destroyed) return;

        const channel = client.channels?.cache.get(player.textChannelId);
        if (!channel) return;

        if (player.msg?.delete) {
          player.msg.delete().catch(() => {});
        }
        const queueMsgs = player.queueMsgs || [];
        for (const msg of queueMsgs) {
          msg.delete().catch(() => {});
        }
        player.queueMsgs = [];
        const title     = track.title     || 'Unknown';
        const author    = track.author    || 'Unknown';
        const thumb     = track.thumbnail || 'https://files.catbox.moe/fnlch5.jpg';
        const duration  = track.duration ? msToTime(track.duration) : '0:00';
        const requester = track.requester?.username || 'Unknown';
        const queueSize = player.queue?.size ?? player.queue?.length ?? 0;
        const progressBar = buildProgressBar(0, track.duration ?? 0);

        logger.player(`Now playing: ${title} - ${author}`);
        const queueText = queueSize > 0 ? `${queueSize} song${queueSize !== 1 ? 's' : ''} in queue` : 'No songs in queue';
        const sent = await channel.send({
          flags: 32768,
          components: [
            {
              type: 17,
              components: [
                {
                  type: 12,
                  items: [
                    {
                      media: {
                        url: 'https://i.ibb.co.com/svYxCr4B/Now-playing.png'
                      }
                    }
                  ]
                },
                {
                  type: 9,
                  components: [
                    {
                      type: 10,
                      content: [
                        `## ${title}`,
                        '',
                        `**${title} - ${author}**`,
                        `\`${progressBar}\``,
                        `-# Playing | \`${duration}\``,
                        '',
                        `-# ${queueText}`,
                        `-# Requester: **${requester}**`
                      ].join('\n')
                    }
                  ],
                  accessory: {
                    type: 11,
                    media: { url: thumb }
                  }
                },
                { type: 14 },
                {
                  type: 1,
                  components: [
                    {
                      style: 4,
                      type: 2,
                      custom_id: 'stop',
                      emoji: { id: '1449501286360944853', name: 'stop' }
                    },
                    {
                      style: 2,
                      type: 2,
                      custom_id: 'previous',
                      emoji: { name: 'previous', id:'1449501284272181309' }
                    },
                    {
                      style: 2,
                      type: 2,
                      custom_id: 'pause_resume',
                      emoji: { name: 'pause', id:'1449501265720774656' }
                    },
                    {
                      style: 2,
                      type: 2,
                      custom_id: 'skip',
                      emoji: { id: '1449501258791518370', name: 'skip' }
                    },
                    {
                      style: 2,
                      type: 2,
                      custom_id: 'queue',
                      emoji: { name: 'queue', id: '1451682061697159310' }
                    }
                  ]
                },
                {
                  type: 1,
                  components: [
                    {
                      style: 2,
                      type: 2,
                      custom_id: 'shuffle',
                      emoji: { name: 'shuffle', id: '1449501276131033219' }
                    },
                    {
                      style: 2,
                      type: 2,
                      custom_id: 'loop',
                      emoji: { name: 'loop', id: '1449501269818609876' }
                    },
                    {
                      style: 2,
                      type: 2,
                      custom_id: 'volume_down',
                      emoji: { name: 'volume down', id: '1449501262642020442' }
                    },
                    {
                      style: 2,
                      type: 2,
                      custom_id: 'volume_up',
                      emoji: { name: 'volume up', id: '1449501288869138482' }
                    },
                    {
                      style: 2,
                      type: 2,
                      custom_id: 'lyrics',
                      emoji: { name: 'lyrics', id: '1482110308435628153' }
                    }
                  ]
                }
              ]
            }
          ]
        }).catch(e => {
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