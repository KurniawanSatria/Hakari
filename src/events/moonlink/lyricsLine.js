// src/events/moonlink/lyricsLine.js - Real-time synced lyrics updates

const logger = require('../../structures/logger');

const CONTEXT = 2;

function getLineText(line) {
  if (!line) return '';
  if (typeof line === 'string') return line;
  if (line.segments && Array.isArray(line.segments)) {
    return line.segments.map(s => s.text || '').join('');
  }
  return line.text || line.line || '';
}

function formatTime(ms) {
  if (!ms || ms < 0) return null;
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

module.exports = {
  name: 'lyricsLine',
  register: (client) => {
    client.manager.on('lyricsLine', async (player, payload) => {
      try {
        if (!player || player.destroyed) return;
        if (!player.playing && !player.paused) return;

        const track = player.current;
        const msg = player.msg;

        if (!msg || !msg.editable) return;

        const lineData = payload?.line;
        const lineTime = lineData?.timestamp;
        const lineText = lineData?.line || '';

        const lines = player.lyricsLines || [];
        let currentIdx = -1;

        if (payload?.lineIndex !== undefined) {
          currentIdx = payload.lineIndex;
        } else if (lineTime !== undefined && lines.length > 0) {
          currentIdx = lines.findIndex(l =>
            l.time <= lineTime && (l.endTime === undefined || l.endTime > lineTime)
          );
        }

        let lyricsDisplay;

        if (currentIdx >= 0 && lines.length > 0) {
          const before = [];
          for (let i = Math.max(0, currentIdx - CONTEXT); i < currentIdx; i++) {
            before.push(getLineText(lines[i]));
          }

          const current = getLineText(lines[currentIdx]);

          const after = [];
          for (let i = currentIdx + 1; i < Math.min(lines.length, currentIdx + CONTEXT + 1); i++) {
            after.push(getLineText(lines[i]));
          }

          lyricsDisplay = before.map(t => `~~${t}~~`).join('\n') + '\n**' + current + '**\n' + after.map(t => `~~${t}~~`).join('\n');
        } else if (lineText) {
          lyricsDisplay = lineText;
        } else {
          lyricsDisplay = '♪';
        }

        const timeStr = lineTime !== undefined ? formatTime(lineTime) : null;
        const thumb = track?.thumbnail || 'https://files.catbox.moe/fnlch5.jpg';
        const title = track?.title || 'Unknown';
        const author = track?.author || 'Unknown';
        const requester = track?.requester?.username || 'Unknown';
        const duration = formatTime(track?.duration);
        const status = player.paused ? 'Paused' : 'Playing';

        await msg.edit({
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
                  "content": '```ANSI\n[1;37m' + lyricsDisplay + '[0m\n```'
                },
                {
                  "type": 10,
                  "content": `-# Requester: ${requester} • Duration: \`${duration}\``
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
        });

      } catch (err) {
        logger.error(`[lyricsLine] ${err.message}`);
      }
    });
  }
};