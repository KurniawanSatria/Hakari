// src/commands/skip.js - Skip command

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
            return { allowed: false, reason: `${action}ing ${player[voteKey].size}/${required} (${required - player[voteKey].size} votes needed)` };
        }

        // Voting passed
        player[voteKey] = new Set();
        return { allowed: true };
    }

    // Requester or requester not in voice - allow immediately
    return { allowed: true };
}

module.exports = {
  name: 'skip',
  aliases: ['s', 'next'],
  execute: async (client, message, args) => {
    try {
      const player = client.manager?.players.get(message.guild.id);
      if (!player || !player.current) {
        return message.reply(hakariMessage('### No Track\nNo track currently playing.'));
      }

      // Check voting system
      const voteResult = await handleVoting(player, message, 'skip');
      if (!voteResult.allowed) {
        return message.reply(hakariMessage(voteResult.reason));
      }

      const title = player.current.title;
      player.skip();

      message.reply(hakariMessage(`### Skipped\n**${title}**`));

    } catch (err) {
      message.reply(hakariMessage('### Error\nError skipping track.'));
    }
  }
};