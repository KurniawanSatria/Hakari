const logger = require('../structures/logger');
const config = require('../structures/config');

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
  if (uri?.includes('spotify')) return { name: 'Spotify', icon: 'https://cdn-icons-png.flaticon.com/512/2111/2111624.png' };
  if (uri?.includes('youtube')) return { name: 'YouTube', icon: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png' };
  if (uri?.includes('soundcloud')) return { name: 'SoundCloud', icon: 'https://cdn-icons-png.flaticon.com/512/145/145809.png' };
  return { name: 'Unknown', icon: null };
}

module.exports = {
  name: 'play',
  aliases: ['p'],
  execute: async (client, message, args) => {
    try {
      const query = args.join(' ').trim();
      if (!query) return message.reply('Please provide a song name or URL.');
      if (!message.member.voice.channel) return message.reply('You must be in a voice channel.');
      if (!client.manager) return message.reply('Music manager not initialized.');

      message.delete().catch(() => { });

      const player = client.manager.players.create({
        guildId: message.guild.id,
        voiceChannelId: message.member.voice.channel.id,
        textChannelId: message.channel.id,
        deaf: true,
        autoplay: config.autoplay
      });

      if (!player.connected) await player.connect();

      const result = await client.manager.search({ query, requester: message.author });
      const { loadType, tracks, playlistInfo } = result;

      if (!tracks || tracks.length === 0) {
        return message.reply('No results found.');
      }

      if (loadType === 'playlist') {
          const queueStart = player.queue.tracks?.length || 0;

          for (const track of tracks) {
            track.setRequester?.(message.author) || (track.requester = message.author);
            player.queue.add(track);
          }

          const totalDuration = tracks.reduce((a, t) => a + (t.duration || 0), 0);
          const source = getSourceInfo(tracks[0].uri);
          await message.channel.send({
            embeds: [{
              author: {
                name: message.author.username,
                icon_url: message.author.displayAvatarURL({ dynamic: true })
              },
              title: 'Playlist Added to Queue',
              description: `**${playlistInfo.name}**\n`,
                fields: [
                { name: 'Tracks', value: `**${tracks.length}**`, inline: true },
                { name: 'Duration', value: `\`${playlistInfo.duration || formatDuration(totalDuration)}\`\n`, inline: true },
              ],
              thumbnail: {
                url: tracks[0]?.thumbnail
              },
              color: 16687280,
              footer: {
                text: sources,
                icon_url: source.icon
              }
            }]
          });

        } else {
          const track = tracks[0];
          track.setRequester?.(message.author) || (track.requester = message.author);
          player.queue.add(track);

          const queueSize = player.queue.tracks?.length || 0;
          const position = queueSize - 1;
          const source = getSourceInfo(track.uri);

          let queueMsg = await message.channel.send({
            embeds: [{
              author: { name: message.author.username, icon_url: message.author.displayAvatarURL({ dynamic: true }) },
              title: 'Added to queue',
              description: `**${track.title}** - **${track.author}**`,
              thumbnail: { url: track.thumbnail },
              fields: [
                { name: 'Duration', value: '`' + formatDuration(track.duration) + '`', inline: true },
                { name: 'Position', value: `\`#${position + 1}/${queueSize}\``, inline: true }
              ],
              color: 16687280,
              footer: { text: source.name, icon_url: source.icon }
            }]
          });
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
          message.reply('Voice connection issue. Try again in a moment.');
        } else {
          player?.destroy();
          message.reply('An error occurred.');
        }
      }
    }
};