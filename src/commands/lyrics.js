// src/commands/lyrics.js - Lyrics command

const { hakariCard, hakariMessage } = require('../structures/builders');
const { EMOJIS } = require('../structures/emojis');

module.exports = {
  name: 'lyrics',
  aliases: ['lyric', 'lrc'],
  execute: async (client, message, args) => {
    try {
      const player = client.manager?.players.get(message.guild.id);

      if (!player || !player.current) {
        return message.reply(hakariMessage(`### ${EMOJIS.lyrics.musicalnote} Hakari Music - Lyrics\n\nNo track currently playing.\n\nUse \`.play <song>\` to start.`));
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

          return message.reply(hakariCard({ content: `### ${EMOJIS.lyrics.lyrics} lyrics: ${track.title}\n\n${text}\n\n-# ${lines.length} synced lines`, thumbnailURL: track.thumbnail }));
        }
      }

      return message.reply(hakariCard({ content: `### ${EMOJIS.ui.error} No lyrics available\n\n**${track.title}**\n\nLyrics not found for this track.\n\n-# Use NodeLink for lyrics support`, thumbnailURL: track.thumbnail }));

    } catch (err) {
      message.reply(hakariMessage('### Error\nError getting lyrics.'));
    }
  }
};
