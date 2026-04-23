// src/events/moonlink/trackStart.js - Track start event with music card

const logger = require('../../structures/logger');
const { initFonts, generateNowPlayingCard } = require('../../structures/musicard');

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
          player.msg.delete().catch(() => { });
        }
        const queueMsgs = player.queueMsgs || [];
        for (const msg of queueMsgs) {
          msg.delete().catch(() => { });
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
          logger.moonlink(`Subscribed to lyrics for ${title}`);
        } catch (err) {
          logger.error(`subscribeLyrics failed: ${err.message}`);
        }

        logger.player(`Now playing: ${title} - ${author}`);

        // Generate music card
        await initFonts();
        const cardBuffer = await generateNowPlayingCard(track);

        // Send music card + controls
        const sent = await channel.send({
          files: [{ attachment: cardBuffer, name: 'nowplaying.png' }],
          "flags": 32768,
          "components": [
            {
              "type": 17,
              "components": [
                {
                  "type": 12,
                  "items": [
                    {
                      "media": {
                        "url": 'attachment://nowplaying.png'
                      }
                    }
                  ]
                },
                {
                  "type": 10,
                  "content": `### <:lyrics:1482110308435628153> Lyrics Synced\n♪ Lyrics will be shown here... **(if available)**`
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
          logger.error(`Send failed: ${e.message}`);
          return null;
        });

        if (sent) {
          player.msg = sent;
        }

        // // Send music card as attachment if generated
        // if (cardBuffer) {
        //   await channel.send({
        //     files: [{ attachment: cardBuffer, name: 'nowplaying.png' }]
        //   }).catch(e => {
        //     logger.error(`[trackStart] Card send failed: ${e.message}`);
        //   });
        // }

      } catch (err) {
        logger.error(`trackStart error: ${err.message}`, { stack: err.stack });
      }
    });
  }
};