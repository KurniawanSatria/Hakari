const logger = require('../structures/logger');
const config = require('../structures/config');
const { hakariMessage, hakariCard } = require('../structures/builders');
const FALLBACK_THUMB = 'https://files.catbox.moe/fnlch5.jpg';

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
      
      // Check if user is in voice channel
      if (!message.member?.voice?.channel) {
        return message.reply(hakariMessage('You must be in a voice channel.'));
      }

      // Check if manager is initialized
      if (!client.manager) {
        logger.error('Music manager not initialized when play command was called');
        return message.reply(hakariMessage('Music manager not initialized. Please try again.'));
      }

      // Check if nodes are available using NodeManager API
      let hasNodes = false;
      try {
        // Use NodeManager properties to check node availability
        hasNodes = client.manager.nodes?.hasReady || client.manager.nodes?.hasOnlineNodes || false;
        
        // Log for debugging
        logger.debug(`Play command: hasReady=${client.manager.nodes?.hasReady}, hasOnline=${client.manager.nodes?.hasOnlineNodes}`);
      } catch (err) {
        logger.debug(`play: Could not check nodes: ${err.message}`);
      }
      
      // Don't block if nodes might be connecting - let search/play handle errors

      // Create or get existing player
      let player;
      try {
        player = client.manager.players.create({
          guildId: message.guild.id,
          voiceChannelId: message.member.voice.channel.id,
          textChannelId: message.channel.id,
          deaf: true,
          autoplay: true,
          volume: 100 // Default volume
        });
      } catch (err) {
        logger.error(`Failed to create player: ${err.message}`);
        return message.reply(hakariMessage('### Error\nFailed to create music player. Please try again.'));
      }

      player.setAutoPlay(true);

      // Connect to voice channel if not already connected
      if (!player.connected) {
        try {
          await player.connect();
        } catch (err) {
          logger.error(`Failed to connect to voice: ${err.message}`);
          player.destroy();
          return message.reply(hakariMessage('### Connection Error\nFailed to join voice channel. Check permissions and try again.'));
        }
      }

      // Validate voice channel permissions
      const voiceChannel = message.member.voice.channel;
      const permissions = voiceChannel.permissionsFor(client.user);
      if (!permissions?.has('Connect') || !permissions?.has('Speak')) {
        player.destroy();
        return message.reply(hakariMessage('### Permission Error\nI need permission to connect and speak in your voice channel.'));
      }

      // Determine search source based on query type
      let searchQuery = query;
      const isURL = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/i.test(query);
      
      // If not a URL, use Spotify search prefix
      if (!isURL && !query.startsWith('spsearch:') && !query.startsWith('ytsearch:') && !query.startsWith('ytmsearch:') && !query.startsWith('scsearch:')) {
        searchQuery = `spsearch:${query}`;
      }

      // Search for tracks with timeout
      let result;
      try {
        const searchTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Search timed out after 15 seconds')), 15000)
        );
        result = await Promise.race([
          client.manager.search({ query: searchQuery, requester: message.author }),
          searchTimeout
        ]);
      } catch (err) {
        logger.error(`Search failed: ${err.message}`);
        if (player.queue.size === 0) player.destroy();
        return message.reply(hakariMessage('### Search Error\nFailed to search for tracks. Please try again.'));
      }

      const { loadType, tracks, playlistInfo } = result;

      if (!tracks || tracks.length === 0) {
        if (player.queue.size === 0) player.destroy();
        return message.reply(hakariMessage('No results found. Try a different search term.'));
      }

      // Add tracks to queue
      if (loadType === 'playlist') {
        try {
          const queueStart = player.queue.tracks?.length || 0;

          for (const track of tracks) {
            track.setRequester?.(message.author) || (track.requester = message.author);
            player.queue.add(track);
          }

          const totalDuration = tracks.reduce((a, t) => a + (t.duration || 0), 0);
          const source = getSourceInfo(tracks[0].uri);
          await message.reply(hakariCard({
            content: `### Playlist Loaded\n**[${playlistInfo?.name || 'Unknown Playlist'}](${query})**\n\n> **Tracks:** ${tracks.length}\n> **Duration:** \`${formatDuration(playlistInfo?.duration) || formatDuration(totalDuration)}\`\n\n-# ${source.emoji || ''} ${source.name}`,
            thumbnailURL: tracks[0]?.thumbnail || FALLBACK_THUMB,
          }));
        } catch (err) {
          logger.error(`Failed to add playlist: ${err.message}`);
          return message.reply(hakariMessage('### Error\nFailed to add playlist to queue.'));
        }
      } else {
        try {
          const track = tracks[0];
          track.setRequester?.(message.author) || (track.requester = message.author);
          player.queue.add(track);

          const queueSize = player.queue.tracks?.length || 0;
          const position = queueSize > 0 ? queueSize - 1 : 0;
          const source = getSourceInfo(track.uri);

          let queueMsg = await message.reply(hakariCard({
            content: `### Added to queue\n**[${track.title || 'Unknown'}](${track.uri || ''})**\n${track.author || 'Unknown'} — \`${formatDuration(track.duration)}\`\n\`#${position + 1}/${queueSize}\`\n\n-# ${source.emoji || ''} ${source.name}`,
            thumbnailURL: track.thumbnail || FALLBACK_THUMB,
          }));
          
          if (queueMsg) {
            player.queueMsgs = player.queueMsgs || [];
            player.queueMsgs.push(queueMsg);
          }
        } catch (err) {
          logger.error(`Failed to add track to queue: ${err.message}`);
          return message.reply(hakariMessage('### Error\nFailed to add track to queue.'));
        }
      }

      // Start playing if not already playing
      if (!player.playing && !player.paused) {
        try {
          player.play();
        } catch (err) {
          logger.error(`Failed to start playback: ${err.message}`);
          return message.reply(hakariMessage('### Playback Error\nFailed to start playback. Try again or use the stop command.'));
        }
      }

    } catch (err) {
      logger.error(`Play command error: ${err.message}`, { stack: err.stack });
      
      // Send appropriate error message
      const msg = err.message.toLowerCase();
      let errorMessage = '### Error\nAn unexpected error occurred. Please try again.';
      
      if (msg.includes('disconnected') || msg.includes('connection')) {
        errorMessage = '### Connection Error\nVoice connection issue. Try again in a moment.';
      } else if (msg.includes('permission') || msg.includes('missing access')) {
        errorMessage = '### Permission Error\nI don\'t have the required permissions. Check channel permissions.';
      } else if (msg.includes('timed out') || msg.includes('timeout')) {
        errorMessage = '### Timeout Error\nThe request took too long. Please try again.';
      }
      
      // Only destroy player if queue is empty
      const player = client.manager?.players.get(message.guild?.id);
      if (player && player.queue.size === 0) {
        player.destroy();
      }
      
      message.reply(hakariMessage(errorMessage));
    }
  }
};
