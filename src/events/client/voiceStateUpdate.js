const logger = require('../../structures/logger');
const { rejectMessage } = require('../../structures/builders');

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

      const guild = client.guilds?.cache.get(guildId);
      const guildName = guild?.name || 'Unknown';
      const oldChannelName = oldState.channelId ? (client.channels?.cache.get(oldState.channelId)?.name || 'Unknown') : 'None';
      const newChannelName = newState.channelId ? (client.channels?.cache.get(newState.channelId)?.name || 'Unknown') : 'None';
      const player = client.manager?.players.get(guildId);
      
      // Bot joined a channel
      if (!oldState.channelId && newState.channelId) {
        logger.info(`Bot Joined Voice Channel: ${newChannelName} in ${guildName}`);
        return;
      }
      
      // Bot was kicked/disconnected from voice channel
      if (oldState.channelId && !newState.channelId) {
        logger.warn(`Bot was kicked/disconnected from Voice Channel: ${oldChannelName} in ${guildName}`);
        
        // Clean up player and notify text channel
        try {
          if (player && !player.destroyed) {
            // Find text channel to send notification
            const textChannel = guild?.channels?.cache.get(player.textChannelId);
            
            // Clean up messages
            if (player.msg?.delete) {
              player.msg.delete().catch(() => {});
              player.msg = null;
            }
            
            if (player.lyricsMsg?.delete) {
              player.lyricsMsg.delete().catch(() => {});
              player.lyricsMsg = null;
            }
            
            // Clear queue and destroy player
            player.queue?.clear();
            await player.destroy('bot kicked from voice channel');
            
            // Notify in text channel
            if (textChannel) {
              await textChannel.send(
                rejectMessage('I have been kicked from the voice channel <a:sad:1498882453883060294>')
              ).catch(() => {});
            }
            
            logger.info(`voiceStateUpdate: Player destroyed after bot was kicked from voice in ${guildName}`);
          }
        } catch (err) {
          logger.error(`voiceStateUpdate: Error cleaning up after kick: ${err.message}`);
        }
        return;
      }
      
      // Bot was moved to another voice channel
      if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        logger.info(`Bot was moved: ${oldChannelName} -> ${newChannelName} in ${guildName}`);
        
        try {
          if (player && !player.destroyed) {
            // Update player voice channel ID
            if (typeof player.setVoiceChannelId === 'function') {
              player.setVoiceChannelId(newState.channelId);
            } else {
              // Fallback: manually update the property
              player.voiceChannelId = newState.channelId;
            }
            
            // Notify in text channel
            const textChannel = guild?.channels?.cache.get(player.textChannelId);
            if (textChannel) {
              await textChannel.send(
                rejectMessage(`I’ve been moved to ${newChannelName}. Alright, continuing playback there.`)
              ).catch(() => {});
            }
            
            logger.debug(`voiceStateUpdate: Updated player voice channel to ${newChannelName}`);
          }
        } catch (err) {
          logger.error(`voiceStateUpdate: Error handling voice channel move: ${err.message}`);
        }
        return;
      }
      
      // Check if all humans left the voice channel (bot alone)
      if (newState.channelId && player && !player.destroyed) {
        const voiceChannel = guild?.channels?.cache.get(newState.channelId);
        if (voiceChannel) {
          const humanMembers = voiceChannel.members.filter(m => !m.user.bot);
          
          if (humanMembers.size === 0) {
            logger.info(`Bot is alone in voice channel ${newChannelName}, waiting before disconnect...`);
            
            // Set a timeout to auto-disconnect after 30 seconds if still alone
            player.aloneTimeout = setTimeout(async () => {
              try {
                const currentVoiceChannel = guild?.channels?.cache.get(player.voiceChannelId);
                const currentHumanMembers = currentVoiceChannel?.members.filter(m => !m.user.bot);
                
                if (currentHumanMembers?.size === 0) {
                  logger.info(`Bot still alone, disconnecting from ${newChannelName}`);
                  
                  const textChannel = guild?.channels?.cache.get(player.textChannelId);
                  
                  // Clean up messages
                  if (player.msg?.delete) {
                    player.msg.delete().catch(() => {});
                    player.msg = null;
                  }
                  
                  if (player.lyricsMsg?.delete) {
                    player.lyricsMsg.delete().catch(() => {});
                    player.lyricsMsg = null;
                  }
                  
                  player.queue?.clear();
                  await player.destroy('left alone in voice channel');
                  
                  if (textChannel) {
                    await textChannel.send(
                      rejectMessage('No one’s here anymore... I guess I’ll leave too.')
                    ).catch(() => {});
                  }
                }
              } catch (err) {
                logger.error(`voiceStateUpdate: Error in alone timeout: ${err.message}`);
              }
            }, 30000); // 30 seconds
          } else {
            // Someone joined, clear the timeout
            if (player.aloneTimeout) {
              clearTimeout(player.aloneTimeout);
              player.aloneTimeout = null;
              logger.debug('Cleared alone timeout - users are present');
            }
          }
        }
      }
      
    } catch (err) {
      logger.error(`voiceStateUpdate handler error: ${err.message}`, { stack: err.stack });
    }
  }
};