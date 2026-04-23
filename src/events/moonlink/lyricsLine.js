// src/events/moonlink/lyricsLine.js - Real-time synced lyrics updates

const logger = require('../../structures/logger');
const { FALLBACK_THUMB } = require('../../structures/components');

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
        const msg = player.lyricsMsg;
        
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
        
        let description;
        
        if (currentIdx >= 0 && lines.length > 0) {
          const before = [];
          for (let i = Math.max(0, currentIdx - CONTEXT); i < currentIdx; i++) {
            before.push(getLineText(lines[i]));
          }
          
          const current = `**${getLineText(lines[currentIdx])}**`;
          
          const after = [];
          for (let i = currentIdx + 1; i < Math.min(lines.length, currentIdx + CONTEXT + 1); i++) {
            after.push(getLineText(lines[i]));
          }
          
          description = [...before.map(t => `~~${t}~~`), current, ...after.map(t => `~~${t}~~`)].join('\n');
        } else if (lineText) {
          description = lineText;
        } else {
          description = '♪';
        }
        
        const timeStr = lineTime !== undefined ? formatTime(lineTime) : null;
        const status = player.paused ? 'Paused' : 'Playing';
        const thumb = track?.thumbnail || FALLBACK_THUMB;
        const title = track?.title || 'Unknown';
        const author = track?.author || 'Unknown';
        
        await msg.edit({
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
                      "content": `### <:lyrics:1482110308435628153> Lyrics Synced\n- **${title}**\n- *${author}*`
                    }
                  ],
                  "accessory": {
                    "type": 11,
                    "media": {
                      "url": thumb
                    }
                  }
                },
                {
                  "type": 14
                },
                {
                  "type": 10,
                  "content": '```' + description + '```'
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