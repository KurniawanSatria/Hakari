const logger = require('../../structures/logger');

module.exports = {
  name: 'voiceStateUpdate',
  execute: async (client, oldState, newState) => {
    try {
      // Validate state objects
      if (!oldState || !newState) {
        logger.debug('voiceStateUpdate: Invalid state objects');
        return;
      }

      // Only care about bot's voice state changes
      if (oldState.member?.id !== client.user?.id && newState.member?.id !== client.user?.id) {
        return;
      }
      
      // Safely get guild and channel info
      const guildId = newState.guild?.id || oldState.guild?.id;
      if (!guildId) {
        logger.debug('voiceStateUpdate: No guild ID available');
        return;
      }

      const guildName = client.guilds?.cache.get(guildId)?.name || 'Unknown';
      const oldChannelName = oldState.channelId ? (client.channels?.cache.get(oldState.channelId)?.name || 'Unknown') : 'None';
      const newChannelName = newState.channelId ? (client.channels?.cache.get(newState.channelId)?.name || 'Unknown') : 'None';
      
      // Bot joined a channel
      if (!oldState.channelId && newState.channelId) {
        logger.info(`Bot Joined Voice Channel: ${newChannelName} in ${guildName}`);
        return;
      }
      
      // Bot was disconnected or left a channel
      if (oldState.channelId && !newState.channelId) {
        logger.info(`Bot Left Voice Channel: ${oldChannelName} in ${guildName}`);
        
        // Clean up player if exists
        try {
          const player = client.manager?.players.get(guildId);
          if (player && !player.destroyed) {
            logger.info(`voiceStateUpdate: Destroying player for guild ${guildName} after bot left voice`);
            
            // Clean up messages
            if (player.msg?.delete) {
              player.msg.delete().catch(() => {});
              player.msg = null;
            }
            
            if (player.lyricsMsg?.delete) {
              player.lyricsMsg.delete().catch(() => {});
              player.lyricsMsg = null;
            }
            
            player.destroy('bot left voice channel');
          }
        } catch (err) {
          logger.error(`voiceStateUpdate: Error cleaning up player: ${err.message}`);
        }
        return;
      }
      
      // Bot switched voice channels
      if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        logger.info(`Bot Switched Voice Channel: ${oldChannelName} -> ${newChannelName} in ${guildName}`);
        
        try {
          // Update player voice channel
          const player = client.manager?.players.get(guildId);
          if (player && !player.destroyed) {
            player.setVoiceChannelId(newState.channelId);
            logger.debug(`voiceStateUpdate: Updated player voice channel to ${newChannelName}`);
          }
        } catch (err) {
          logger.error(`voiceStateUpdate: Error updating player voice channel: ${err.message}`);
        }
      }
      
    } catch (err) {
      logger.error(`voiceStateUpdate handler error: ${err.message}`, { stack: err.stack });
    }
  }
};