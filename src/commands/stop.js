// src/commands/stop.js - Stop command

const { hakariMessage } = require('../structures/builders');

// Helper: Check if requester is still in voice channel
function isRequesterInVoice(player, message) {
    const requester = player.current?.requester;
    if (!requester) return false;

    const voiceChannel = message.guild.channels.cache.get(player.voiceChannelId);
    if (!voiceChannel) return false;

    return voiceChannel.members.has(requester.id);
}

// Helper: Handle voting system
async function handleVoting(player, message, action) {
    const userVoice = message.member.voice.channel;
    if (!userVoice || userVoice.id !== player.voiceChannelId) {
        return { allowed: false, reason: "You must be in the voice channel to use this command." };
    }

    // Check if requester is in voice
    const requesterInVoice = isRequesterInVoice(player, message);
    const isRequester = player.current?.requester && message.author.id === player.current.requester.id;

    // If requester is in voice and this is not the requester, trigger voting
    if (requesterInVoice && !isRequester) {
        const voteKey = `${action}Votes`;
        player[voteKey] = player[voteKey] || new Set();

        if (player[voteKey].has(message.author.id)) {
            return { allowed: false, reason: `You have already voted to ${action}.` };
        }

        player[voteKey].add(message.author.id);

        const voiceChannel = message.guild.channels.cache.get(player.voiceChannelId);
        const totalUsers = voiceChannel.members.filter(m => !m.user.bot).size;
        const required = Math.ceil(totalUsers / 2);

        if (player[voteKey].size < required) {
            return { allowed: false, reason: `Vote to ${action} added! (${player[voteKey].size}/${required} votes needed)` };
        }

        // Voting passed
        player[voteKey] = new Set();
        return { allowed: true };
    }

    // Requester or requester not in voice - allow immediately
    return { allowed: true };
}

module.exports = {
  name: 'stop',
  aliases: ['leave', 'disconnect'],
  execute: async (client, message, args) => {
    try {
      const player = client.manager?.players.get(message.guild.id);
      if (!player) {
        return message.reply(hakariMessage('### No Player\nNo active player in this server.'));
      }

      // Check voting system
      const voteResult = await handleVoting(player, message, 'stop');
      if (!voteResult.allowed) {
        return message.reply(hakariMessage(voteResult.reason));
      }

      if (player.lyricsMsg) {
        player.lyricsMsg.delete().catch(() => {});
        player.lyricsMsg = null;
      }
      player.lyricsData = null;
      player.lyricsLines = null;

     // Clean up track message
        const playerMsg = global.db.data.guilds[player.guildId].message;
        if (playerMsg?.id && playerMsg?.channelId) {
          const oldChannel = client.channels?.cache.get(playerMsg.channelId);
          if (oldChannel) {
            const oldMsg = await oldChannel.messages.fetch(playerMsg.id).catch(() => null);
            if (oldMsg && oldMsg.deletable) {
              await oldMsg.delete().catch(() => null);
              global.db.data.guilds[player.guildId].message = null;
              await global.db.write();
            }
          }
        }

      await player.stop();
      await player.queue.clear();
      message.reply(hakariMessage('Stopped the player.'));
    } catch (err) {
      message.reply(hakariMessage('### Error\nError stopping.'));
    }
  }
};