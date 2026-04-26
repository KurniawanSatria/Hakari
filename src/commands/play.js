const logger = require('../structures/logger');
const config = require('../structures/config');
const { hakariMessage, hakariCard } = require('../structures/builders');

function formatDuration(ms) {
  if (!ms || isNaN(ms)) return 'Unknown';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function getSourceInfo(uri) {
  if (uri?.includes('spotify')) return { name: 'Spotify', emoji: '<:spy:1481718391847915631>' };
  if (uri?.includes('youtube')) return { name: 'YouTube', emoji: '<:yt:1481718394075222248>' };
  if (uri?.includes('soundcloud')) return { name: 'SoundCloud', emoji: '<:sc:1481718389226602506>' };
  return { name: 'Unknown', emoji: null };
}

module.exports = {
  name: 'play',
  aliases: ['p'],
  execute: async (client, message, args) => {
    try {
      const query = args.join(' ').trim();
      if (!query) return message.reply(hakariMessage('Please provide a song name or URL.'));
      if (!message.member.voice.channel) return message.reply(hakariMessage('You must be in a voice channel.'));
      if (!client.manager) return message.reply(hakariMessage('Music manager not initialized.'));
      const player = client.manager.players.create({
        guildId: message.guild.id,
        voiceChannelId: message.member.voice.channel.id,
        textChannelId: message.channel.id,
        deaf: true,
        autoplay: true
      });
      player.setAutoPlay(true)

      if (!player.connected) await player.connect();

      // Determine search source based on query type
      let searchQuery = query;
      const isURL = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/i.test(query);
      
      // If not a URL, use Spotify search prefix
      if (!isURL && !query.startsWith('spsearch:') && !query.startsWith('ytsearch:') && !query.startsWith('ytmsearch:') && !query.startsWith('scsearch:')) {
        searchQuery = `spsearch:${query}`;
      }

      const result = await client.manager.search({ query: searchQuery, requester: message.author });
      const { loadType, tracks, playlistInfo } = result;

      if (!tracks || tracks.length === 0) {
        return message.reply(hakariMessage('No results found.'));
      }
      //message.delete().catch(() => { });

      if (loadType === 'playlist') {
          const queueStart = player.queue.tracks?.length || 0;

          for (const track of tracks) {
            track.setRequester?.(message.author) || (track.requester = message.author);
            player.queue.add(track);
          }

          const totalDuration = tracks.reduce((a, t) => a + (t.duration || 0), 0);
          const source = getSourceInfo(tracks[0].uri);
          await message.reply(hakariCard({
            content: `### Playlist Added to Queue\n**${playlistInfo.name}**\n\n> **Tracks:** ${tracks.length}\n> **Duration:** \`${formatDuration(playlistInfo.duration) || formatDuration(totalDuration)}\`\n\n-# ${source.name}`,
            thumbnailURL: tracks[0]?.thumbnail,
          }));

        } else {
          const track = tracks[0];
          track.setRequester?.(message.author) || (track.requester = message.author);
          player.queue.add(track);

          const queueSize = player.queue.tracks?.length || 0;
          const position = queueSize - 1;
          const source = getSourceInfo(track.uri);

          let queueMsg = await message.reply(hakariCard({
            content: `### Added to queue\n**[${track.title}](${track.uri})**\n${track.author} — \`${formatDuration(track.duration)}\`\n\`#${position + 1}/${queueSize}\`\n\n-# ${source.emoji} ${source.name}`,
            thumbnailURL: track.thumbnail,
          }));
          if (queueMsg) {
            player.queueMsgs = player.queueMsgs || [];
            player.queueMsgs.push(queueMsg);
          }

        }

        if (!player.playing && !player.paused) player.play();

      } catch (err) {
        const msg = err.message;
        logger.error(`Play: ${msg}`);
        if (msg.includes('disconnected') || msg.includes('Connection')) {
          message.reply(hakariMessage('### Connection Error\nVoice connection issue. Try again in a moment.'));
        } else {
          player?.destroy();
          message.reply(hakariMessage('### Error\nAn error occurred.'));
        }
      }
    }
};
