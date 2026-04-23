// src/events/moonlink/trackStart.js - Track start event with controls

const { 
  ContainerBuilder, SectionBuilder, TextDisplayBuilder, 
  ThumbnailBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle 
} = require('discord.js');
const logger = require('../../structures/logger');

const FALLBACK_THUMB = 'https://files.catbox.moe/fnlch5.jpg';

/**
 * Format milliseconds to time string
 */
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

/**
 * Get source emoji from URI
 */
function getSource(uri) {
  if (!uri) return '';
  if (uri.includes('spotify')) return '🎧 ';
  if (uri.includes('soundcloud')) return '🎵 ';
  if (uri.includes('youtube')) return '▶ ';
  if (uri.includes('deezer')) return '🎵 ';
  return '';
}

module.exports = {
  name: 'trackStart',
  register: (client) => {
    client.manager.on('trackStart', async (player, track) => {
      try {
        if (!player || player.destroyed) return;
        
        const channel = client.channels?.cache.get(player.textChannelId);
        if (!channel) return;
        
// Clean up previous messages/m data
        if (player.lyricsMsg) {
          player.lyricsMsg.delete().catch(() => {});
          player.lyricsMsg = null;
        }
        player.lyricsData = null;
        player.lyricsLines = null;

        if (player.msg?.delete) {
          player.msg.delete().catch(() => {});
        }
        player.msg = null;
        
        // Get track info FIRST
        const title = track.title || 'Unknown';
        const author = track.author || 'Unknown';
        const thumb = track.thumbnail || FALLBACK_THUMB;
        
        // Subscribe to lyrics (NodeLink) with logging
        try {
          await player.subscribeLyrics();
          logger.info(`[trackStart] Subscribed to lyrics for ${title}`);
        } catch (err) {
          logger.error(`[trackStart] subscribeLyrics failed: ${err.message}`);
        }
        
        const source = getSource(track.uri);
        
        logger.info(`[trackStart] ${title} - ${author}`);
        
        // Now playing embed
        const section = new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `### ▶ Now Playing\n**${title}**\n${author}`
            ),
            new TextDisplayBuilder().setContent(
              `Duration: \`${msToTime(track.duration)}\` • Requested by ${track.requester?.username || 'Unknown'}`
            )
          )
          .setThumbnailAccessory(new ThumbnailBuilder().setURL(thumb));
        
        // Control buttons
        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('stop')
              .setLabel('Stop')
              .setStyle(ButtonStyle.Danger)
              .setEmoji('⏹'),
            new ButtonBuilder()
              .setCustomId('skip')
              .setLabel('Skip')
              .setStyle(ButtonStyle.Primary)
              .setEmoji('⏭')
              .setDisabled(player.queue.size === 0)
          );
        
        await channel.send({
          embeds: [section],
          components: [row]
        }).then(m => {
          player.msg = m;
        }).catch(() => {});
        
      } catch (err) {
        logger.error(`[trackStart] ${err.message}`, { stack: err.stack });
      }
    });
  }
};