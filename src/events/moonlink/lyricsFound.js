// src/events/moonlink/lyricsFound.js - Handle when lyrics are found

const { ContainerBuilder, SectionBuilder, TextDisplayBuilder, ThumbnailBuilder, MessageFlags } = require('discord.js');
const logger = require('../../structures/logger');
const { FALLBACK_THUMB } = require('../../structures/components');

const MAX_PREVIEW = 15;

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
    return payload.text;
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
  
  return typeof payload === 'string' ? payload : JSON.stringify(payload).slice(0, 1000);
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
        const thumb = track?.thumbnail || FALLBACK_THUMB;
        
        logger.info(`[lyricsFound] ${title} (${player.guildId})`);
        
        player.lyricsData = payload;
        player.lyricsLines = payload?.lines || [];
        
        const lyricsText = formatLyrics(payload);
        const type = payload?.type || 'unknown';
        
        // ComponentV2
        const section = new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`### 🎵 lyrics: ${title}\n${lyricsText}`),
            new TextDisplayBuilder().setContent(`-# Synced lyrics • Type: ${type}`)
          )
          .setThumbnailAccessory(new ThumbnailBuilder().setURL(thumb));
        
        try {
          player.lyricsMsg = await channel.send({
            flags: MessageFlags.IsComponentsV2,
            components: [new ContainerBuilder().addSectionComponents(section)]
          });
        } catch (e) {
          logger.error(`[lyricsFound] Send failed: ${e.message}`);
        }
        
      } catch (err) {
        logger.error(`[lyricsFound] ${err.message}`, { stack: err.stack });
      }
    });
  }
};