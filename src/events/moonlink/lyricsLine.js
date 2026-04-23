// src/events/moonlink/lyricsLine.js - Real-time synced lyrics updates

const { ContainerBuilder, SectionBuilder, TextDisplayBuilder, ThumbnailBuilder, MessageFlags, EmbedBuilder } = require('discord.js');
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
          const beforeLines = [];
          for (let i = Math.max(0, currentIdx - CONTEXT); i < currentIdx; i++) {
            beforeLines.push(getLineText(lines[i]));
          }
          
          const currentLine = `**▶ ${getLineText(lines[currentIdx])} ◀**`;
          
          const afterLines = [];
          for (let i = currentIdx + 1; i < Math.min(lines.length, currentIdx + CONTEXT + 1); i++) {
            afterLines.push(getLineText(lines[i]));
          }
          
          description = [...beforeLines.map(t => `*${t}*`), currentLine, ...afterLines.map(t => `*${t}*`)].join('\n');
        } else if (lineText) {
          description = lineText;
        } else {
          description = '♪';
        }
        
        const timeStr = lineTime !== undefined ? formatTime(lineTime) : null;
        const status = player.paused ? '⏸ Paused' : '▶ Playing';
        
        // Try ComponentV2 first
        try {
          const section = new SectionBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`### 🎤 ${track?.title || 'Unknown'}\n${description}`),
              new TextDisplayBuilder().setContent(`-# ⏱ ${timeStr || '0:00'} • ${status}`)
            )
            .setThumbnailAccessory(new ThumbnailBuilder().setURL(track?.thumbnail || FALLBACK_THUMB));
          
          await msg.edit({
            flags: MessageFlags.IsComponentsV2,
            components: [new ContainerBuilder().addSectionComponents(section)]
          });
        } catch (e) {
          // Fallback to regular embed if edit fails
          const embed = new EmbedBuilder()
            .setColor(player.paused ? 65536 : 16612524)
            .setTitle(`🎤 ${track?.title || 'Unknown'}`)
            .setDescription(description?.slice(0, 4000) || '♪')
            .setThumbnail(track?.thumbnail || FALLBACK_THUMB)
            .setFooter({ text: `⏱ ${timeStr || '0:00'} • ${status}` });
          
          await msg.edit({ embeds: [embed] }).catch(() => {});
        }
        
      } catch (err) {
        logger.error(`[lyricsLine] ${err.message}`);
      }
    });
  }
};