const logger = require('../../structures/logger');

module.exports = {
  name: 'voiceStateUpdate',
  execute: async (client, oldState, newState) => {
    try {
      // Only care about bot's state
      if (oldState.member.id !== client.user.id) return;
      
      // Bot joined a channel
      const guildName = client.guilds?.cache.get(newState.guild.id)?.name || 'Unknown';
      const channelName = client.channels?.cache.get(newState.channelId)?.name || 'Unknown';
      if (!oldState.channelId && newState.channelId) {
        logger.info(`Bot Joined Voice Channel ${channelName} in ${guildName}`);
        return;
      }
      
      // Bot left a channel
      if (oldState.channelId && !newState.channelId) {
        logger.info(`Bot Left Voice Channel ${channelName} in ${guildName}`);
        
        // Clean up player if exists
        const player = client.manager?.players.get(oldState.guild?.id);
        if (player) {
          player.destroy();
        }
        return;
      }
      
      // Bot switched channel
      if (oldState.channelId !== newState.channelId) {
        // Update player voice channel
        const player = client.manager?.players.get(oldState.guild?.id);
        if (player) {
          player.setVoiceChannelId(newState.channelId);
        }
      }
      
    } catch (err) {
      logger.error(`in voiceStateUpdate: ${err.message}`);
    }
  }
};