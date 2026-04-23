// src/commands/lyrics.js - Lyrics command

const { errorMsg, FALLBACK_THUMB, wrap, sectionWithThumb, e } = require('../structures/components');

module.exports = {
  name: 'lyrics',
  aliases: ['lyric', 'lrc'],
  execute: async (client, message, args) => {
    try {
      const player = client.manager?.players.get(message.guild.id);
      
      if (!player || !player.current) {
        return message.channel.send(wrap(
          {
            type: 9,
            components: [{
              type: 10,
              content: `### ${e('musicalnote')} Hakari Music - Lyrics\n\nNo track currently playing.\n\nUse \`.play <song>\` to start.`
            }]
          },
          { type: 10, content: '-# Lyrics sync when available via NodeLink' }
        ));
      }
      
      const track = player.current;
      
      if (player.lyricsData) {
        const lines = player.lyricsLines;
        
        if (lines && lines.length > 0) {
          const text = lines.slice(0, 15).map(l => {
            if (typeof l === 'string') return l;
            if (l.segments) return l.segments.map(s => s.text || '').join('');
            return l.text || '';
          }).join('\n');
          
          return message.channel.send(wrap(
            sectionWithThumb(
              `### ${e('lyrics')} lyrics: ${track.title}\n\n${text}`,
              '',
              track.thumbnail || FALLBACK_THUMB
            ),
            { type: 10, content: `-# ${lines.length} synced lines` }
          ));
        }
      }
      
      return message.channel.send(wrap(
        sectionWithThumb(
          `### ${e('error')} No lyrics available\n\n**${track.title}**\n\nLyrics not found for this track.`,
          '',
          track.thumbnail || FALLBACK_THUMB
        ),
        { type: 10, content: '-# Use NodeLink for lyrics support' }
      ));
      
    } catch (err) {
      message.channel.send(errorMsg('Error', 'Error getting lyrics.'));
    }
  }
};