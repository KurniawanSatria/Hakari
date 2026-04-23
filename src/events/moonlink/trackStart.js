// src/events/moonlink/trackStart.js - Track start event with combined lyrics

const logger = require('../../structures/logger');

function msToTime(ms) {
  if (!ms || ms < 0) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;
  return h > 0 
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${m}:${String(sec).padStart(2, '0')}`;
}

module.exports = {
  name: 'trackStart',
  register: (client) => {
    client.manager.on('trackStart', async (player, track) => {
      try {
        if (!player || player.destroyed) return;
        
        const channel = client.channels?.cache.get(player.textChannelId);
        if (!channel) return;
        
        // Clean up previous messages
        if (player.msg?.delete) {
          player.msg.delete().catch(() => {});
        }
        const queueMsgs = player.queueMsgs || [];
        for (const msg of queueMsgs) {
          msg.delete().catch(() => {});
        }
        player.queueMsgs = [];
        
        // Get track info
        const title = track.title || 'Unknown';
        const author = track.author || 'Unknown';
        const thumb = track.thumbnail || 'https://files.catbox.moe/fnlch5.jpg';
        const duration = msToTime(track.duration);
        const requester = track.requester?.username || 'Unknown';
        
        // Subscribe to lyrics
        try {
          await player.subscribeLyrics();
          logger.info(`[trackStart] Subscribed to lyrics for ${title}`);
        } catch (err) {
          logger.error(`[trackStart] subscribeLyrics failed: ${err.message}`);
        }
        
        logger.info(`[trackStart] ${title} - ${author}`);
        
        // Send combined Now Playing + Lyrics message
        const sent = await channel.send({
          "flags": 32768,
          "components": [
            {
              "type": 17,
              "components": [
                {
                  "type": 9,
                  "components": [
                    {
                      "type": 10,
                      "content": `### <:musicalnote:1482113385486352586> Now Playing\n- **${title}**\n- *${author}*\n\n### <:lyrics:1482110308435628153> Lyrics Synced\n♪ Waiting for lyrics...`
                    }
                  ],
                  "accessory": {
                    "type": 11,
                    "media": { "url": thumb }
                  }
                },
                {
                  "type": 10,
                  "content": `-# Requester: ${requester} • Duration: \`${duration}\` • 0:00`
                },
                {
                  "type": 14
                },
                {
                  "type": 1,
                  "components": [
                    {
                      "style": 4,
                      "type": 2,
                      "custom_id": "stop",
                      "label": "Stop",
                      "emoji": { "id": "1449501286360944853", "name": "stop" }
                    },
                    {
                      "style": 1,
                      "type": 2,
                      "emoji": { "id": "1449501258791518370", "name": "skip" },
                      "custom_id": "skip",
                      "label": "Skip"
                    }
                  ]
                }
              ]
            }
          ]
        }).catch(e => {
          logger.error(`[trackStart] Send failed: ${e.message}`);
          return null;
        });
        
        if (sent) {
          player.msg = sent;
        }
        
      } catch (err) {
        logger.error(`[trackStart] ${err.message}`, { stack: err.stack });
      }
    });
  }
};