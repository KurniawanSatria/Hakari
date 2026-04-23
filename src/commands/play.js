// src/commands/play.js - Play music command

const { nowPlaying, trackAdded, playlistAdded, errorMsg } = require('../structures/components');
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

function calcWaitTime(player, positionIndex) {
  let waitMs = 0;
  if (player.playing && player.current) {
    const remaining = (player.current.duration || 0) - (player.position || 0);
    if (remaining > 0) waitMs += remaining;
  }
  const queue = player.queue.tracks || [];
  for (let i = 0; i < positionIndex; i++) {
    waitMs += queue[i]?.duration || 0;
  }
  return waitMs;
}

module.exports = {
  name: 'play',
  aliases: ['p'],
  execute: async (client, message, args) => {
    try {
      const query = args.join(' ').trim();
      if (!query) {
        return message.channel.send({ content: 'Please provide a song name or URL.' });
      }
      if (!message.member.voice.channel) {
        return message.channel.send({ content: 'You must be in a voice channel.' });
      }
      if (!client.manager) {
        return message.channel.send({ content: 'Music manager not initialized.' });
      }
      
      message.delete().catch(() => {});
      
      const player = client.manager.players.create({
        guildId: message.guild.id,
        voiceChannelId: message.member.voice.channel.id,
        textChannelId: message.channel.id,
        deaf: true,
        autoplay: config.autoplay
      });
      
      if (!player.connected) {
        await player.connect();
      }
      
      const result = await client.manager.search({ query, requester: message.author });
      const { loadType, tracks, playlistInfo } = result;
      
      if (loadType === 'playlist') {
        const queueStart = player.queue.tracks?.length || 0;
        for (const track of tracks) {
          track.setRequester?.(message.author) || (track.requester = message.author);
          player.queue.add(track);
        }
        
        const duration = tracks.reduce((a, t) => a + (t.duration || 0), 0);
        const queueMsg = await message.channel.send(playlistAdded(
          playlistInfo?.name || 'Unknown',
          tracks.length,
          formatDuration(duration),
          tracks[0]?.thumbnail
        ));
        
        if (queueMsg && !player.playing && !player.paused) {
          player.queueMsgs = player.queueMsgs || [];
          player.queueMsgs.push(queueMsg);
        }
        
      } else if (loadType === 'search' || loadType === 'track') {
        const track = tracks[0];
        track.setRequester?.(message.author) || (track.requester = message.author);
        const position = player.queue.tracks?.length || 0;
        player.queue.add(track);
        
        const queueSize = player.queue.tracks?.length || 0;
        const isPlaying = !player.playing && !player.paused;
        
        const queueMsg = await message.channel.send(trackAdded(
          track, position, queueSize, formatDuration(track.duration), isPlaying
        ));
        
        if (queueMsg) {
          player.queueMsgs = player.queueMsgs || [];
          player.queueMsgs.push(queueMsg);
        }
        
      } else {
        return message.channel.send(errorMsg('No Results', 'No results found for that query.'));
      }
      
      if (!player.playing && !player.paused) {
        player.play();
      }
      
    } catch (err) {
      const msg = err.message;
      if (msg.includes('disconnected') || msg.includes('Connection')) {
        logger.error(`Play: Voice issue - ${msg}`);
        message.channel.send(errorMsg('Connection Issue', 'Voice connection issue. Try again in a moment.'));
      } else {
        logger.error(`Play: ${msg}`, { stack: err.stack });
        message.channel.send(errorMsg('Error', 'An error occurred.'));
      }
    }
  }
};