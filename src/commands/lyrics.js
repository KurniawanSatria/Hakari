// src/commands/lyrics.js - Lyrics command

const { ACCENT_COLOR, FALLBACK_THUMB } = require('../structures/components');

const msg = (content, thumb) => ({
  flags: 32768,
  components: [{
    type: 17,
    components: [
      { type: 9, components: [{ type: 10, content: content.split('\n')[0] }], accessory: { type: 11, media: { url: thumb || FALLBACK_THUMB }, description: 'Album thumbnail' } },
      { type: 10, content: content.split('\n').slice(1).join('\n') }
    ],
    accent_color: ACCENT_COLOR
  }]
});

module.exports = {
  name: 'lyrics',
  aliases: ['lyric', 'lrc'],
  execute: async (client, message, args) => {
    try {
      const player = client.manager?.players.get(message.guild.id);

      if (!player || !player.current) {
        return message.channel.send(msg('### <:musicalnote:1482113385486352586> Hakari Music - Lyrics\n\nNo track currently playing.\n\nUse `.play <song>` to start.'));
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

          return message.channel.send(msg(`### <:lyrics:1482110308435628153> lyrics: ${track.title}\n\n${text}\n\n-# ${lines.length} synced lines`, track.thumbnail));
        }
      }

      return message.channel.send(msg(`### <:error:1476619354706542766> No lyrics available\n\n**${track.title}**\n\nLyrics not found for this track.\n\n-# Use NodeLink for lyrics support`, track.thumbnail));

    } catch (err) {
      message.channel.send(msg('### Error\nError getting lyrics.'));
    }
  }
};