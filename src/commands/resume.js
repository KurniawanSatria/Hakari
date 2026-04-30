const { hakariMessage } = require('../structures/builders');


function isRequesterInVoice(player, message) {
    const requester = player.current?.requester;
    if (!requester) return false;

    const voiceChannel = message.guild.channels.cache.get(player.voiceChannelId);
    if (!voiceChannel) return false;

    return voiceChannel.members.has(requester.id);
}


async function handleVoting(player, message, action) {
    const userVoice = message.member.voice.channel;
    if (!userVoice || userVoice.id !== player.voiceChannelId) {
        return { allowed: false, reason: "You must be in the voice channel to use this command." };
    }

    const requesterInVoice = isRequesterInVoice(player, message);
    const isRequester = player.current?.requester && message.author.id === player.current.requester.id;

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

        player[voteKey] = new Set();
        return { allowed: true };
    }

    return { allowed: true };
}

module.exports = {
  name: 'resume',
  aliases: ['rs'],
  execute: async (client, message) => {
    try {
      const player = client.manager?.players.get(message.guild.id)

      if (!player || !player.current) {
        return message.reply(hakariMessage('### No Track\nNo track currently playing.'))
      }

      if (!player.paused) {
        return message.reply(hakariMessage('### Not Paused\nTrack is already playing.'))
      }

      const voteResult = await handleVoting(player, message, 'pause');
      if (!voteResult.allowed) {
        return message.reply(hakariMessage(voteResult.reason));
      }

      player.pause(false)

      message.reply(hakariMessage('### Resumed\nPlayback has been resumed.'))

    } catch (err) {
      message.reply(hakariMessage('### Error\nError resuming track.'))
    }
  }
}