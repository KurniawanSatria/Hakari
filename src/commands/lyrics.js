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

      if (player.lyricsData && player.lyricsLines && player.lyricsLines.length > 0) {
        const text = player.lyricsLines.slice(0, 15).map(l => {
          if (typeof l === 'string') return l;
          if (l.segments) return l.segments.map(s => s.text || '').join('');
          return l.text || '';
        }).join('\n');

        return message.reply(hakariCard({ content: `### ${EMOJIS.lyrics.lyrics} lyrics: ${track.title}\n\n${text}\n\n-# ${player.lyricsLines.length} synced lines`, thumbnailURL: track.thumbnail }));
      }

      const pendingMsg = await message.reply(hakariMessage(`### ${EMOJIS.lyrics.musicalnote} Searching for lyrics...\n\n**${track.title}** - ${track.author || 'Unknown'}`));
      player.pendingLyricsMsg = pendingMsg;

      try {
        await player.subscribeLyrics();

        setTimeout(async () => {
          if (player.pendingLyricsMsg && player.pendingLyricsMsg.editable) {
            if (player.lyricsData && player.lyricsLines && player.lyricsLines.length > 0) {
              const text = player.lyricsLines.slice(0, 15).map(l => {
                if (typeof l === 'string') return l;
                if (l.segments) return l.segments.map(s => s.text || '').join('');
                return l.text || '';
              }).join('\n');

              await player.pendingLyricsMsg.edit(hakariCard({ content: `### ${EMOJIS.lyrics.lyrics} lyrics: ${track.title}\n\n${text}\n\n-# ${player.lyricsLines.length} synced lines (from ${player.current.lyrics_provider || 'Unknown'})`, thumbnailURL: track.thumbnail }));
            } else {
              await player.pendingLyricsMsg.edit(hakariCard({ content: `### ${EMOJIS.ui.error} No lyrics available\n\n**${track.title}**\n\nLyrics not found for this track.\n\n-# Use NodeLink for lyrics support`, thumbnailURL: track.thumbnail }));
            }
            setTimeout(() => player.pendingLyricsMsg?.delete().catch(() => {}), 10000);
            player.pendingLyricsMsg = null;
          }
        }, 8000);
      } catch (err) {
        if (pendingMsg && pendingMsg.editable) {
          await pendingMsg.edit(hakariCard({ content: `### ${EMOJIS.ui.error} Error fetching lyrics\n\n**${track.title}**\n\nFailed to retrieve lyrics.\n\n-# ${err.message}`, thumbnailURL: track.thumbnail }));
        }
        player.pendingLyricsMsg = null;
      }

    } catch (err) {
      message.reply(hakariMessage('### Error\nError getting lyrics.'));
    }
  }
};
