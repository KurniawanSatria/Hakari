// src/events/moonlink/lyricsFound.js - Handle when lyrics are found

const logger = require('../../structures/logger');
const { FALLBACK_THUMB, wrap, sectionWithThumb, e } = require('../../structures/components');

const MAX_PREVIEW = 10;

function getLineText(line) {
  if (!line) return '';
  if (typeof line === 'string') return line;
  if (line.segments && Array.isArray(line.segments)) {
    return line.segments.map(s => s.text || '').join('');
  }
  return line.text || line.line || '';
}

function formatLyrics(payload) {
  if (!payload) return 'No lyrics available';
  
  if (payload.text && !payload.lines) {
    return payload.text.slice(0, 1000);
  }
  
  if (payload.lines && Array.isArray(payload.lines)) {
    const lines = payload.lines
      .slice(0, MAX_PREVIEW)
      .map(getLineText)
      .join('\n');
    
    const total = payload.lines.length;
    return total > MAX_PREVIEW 
      ? `${lines}\n\n... and ${total - MAX_PREVIEW} more lines`
      : lines;
  }
  
  return typeof payload === 'string' ? payload.slice(0, 1000) : 'Lyrics available';
}

module.exports = {
  name: 'lyricsFound',
  register: (client) => {
    client.manager.on('lyricsFound', async (player, payload) => {
      try {
        if (!player || player.destroyed) return;
        
        const channel = client.channels?.cache.get(player.textChannelId);
        if (!channel) return;
        
        const track = player.current;
        const title = track?.title || 'Unknown';
        const author = track?.author || 'Unknown';
        const thumb = track?.thumbnail || FALLBACK_THUMB;
        
        logger.info(`[lyricsFound] ${title} (${player.guildId})`);
        
        player.lyricsData = payload;
        player.lyricsLines = payload?.lines || [];
        
        const lyricsText = formatLyrics(payload);
        
        try {
          player.lyricsMsg = await channel.send({
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
              "content": `### <:lyrics:1482110308435628153> Lyrics\n- **${title}**\n- **${author}**`
            }
          ],
          "accessory": {
            "type": 11,
            "media": {
              "url": thumb
            },
          }
        },
        {
          "type": 14
        },
        {
          "type": 10,
          "content": lyricsText
        }
      ]
    }
  ]
});
        } catch (e) {
          logger.error(`[lyricsFound] Send failed: ${e.message}`);
        }
        
      } catch (err) {
        logger.error(`[lyricsFound] ${err.message}`);
      }
    });
  }
};