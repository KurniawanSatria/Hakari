const logger = require('../../structures/logger');
const guildDB = require('../../structures/guildDB');
const { rejectMessage } = require('../../structures/builders');

module.exports = {
    name: 'queueEnd',
    register: (client) => {
        client.manager.on('queueEnd', async (player, lastTrack) => {
            try {
                // Validate player exists and is not destroyed
                if (!player || player.destroyed) {
                    logger.debug('queueEnd: Player already destroyed or null');
                    return;
                }

                const guildId = player.guildId;
                if (!guildId) {
                    logger.error('queueEnd: Missing guildId');
                    return;
                }

                // Safely get channel
                const guildSettings = guildDB.getGuild(guildId);
                let channel = client.channels?.cache.get(player.textChannelId);
                
                if (guildSettings.announceChannelId) {
                  const announceChannel = client.channels?.cache.get(guildSettings.announceChannelId);
                  if (announceChannel) {
                    channel = announceChannel;
                  }
                }
                
                if (!channel) {
                    logger.warn(`queueEnd: Text channel ${player.textChannelId} not found`);
                }

                const title = lastTrack?.title || 'Unknown';
                const author = lastTrack?.author || 'Unknown';
                const guildName = client.guilds?.cache.get(guildId)?.name || 'Unknown';
                const channelName = channel?.name || 'Unknown';
                
                logger.info(`Queue ended for ${guildName} (${channelName}) - Last track: ${title} by ${author}`);

                // Attempt autoplay if there was a last track
                if (lastTrack) {
                    try {
                        if (!guildSettings.autoplay) {
                            logger.debug('queueEnd: Autoplay disabled in guild settings');
                        } else {
                            logger.debug(`Attempting autoplay for ${title} in ${guildName}`);
                            
                            try {
                                const node = client.manager?.node;
                                if (node?.handleAutoPlay) {
                                    await node.handleAutoPlay(player, lastTrack);
                                    logger.info(`Autoplay triggered via node in ${guildName}`);
                                } else {
                                    const query = `${lastTrack.author || ''} ${lastTrack.title || ''}`.trim();
                                    if (!query) {
                                        logger.warn('queueEnd: Empty autoplay query');
                                    } else {
                                        const result = await client.manager.search({
                                            query,
                                            requester: lastTrack.requester || client.user
                                        });

                                        if (result?.tracks?.length > 0) {
                                            const nextTrack = result.tracks[0];
                                            nextTrack.setRequester?.(lastTrack.requester) || (nextTrack.requester = lastTrack.requester);
                                            player.queue.add(nextTrack);
                                            
                                            if (!player.playing && !player.paused) {
                                                player.play();
                                            }
                                            logger.info(`Added autoplay track: ${nextTrack.title || 'Unknown'} in ${guildName}`);
                                        } else {
                                            logger.warn(`queueEnd: No autoplay results for "${query}"`);
                                        }
                                    }
                                }
                            } catch (autoplayErr) {
                                logger.error(`queueEnd: Autoplay error: ${autoplayErr.message}`, { stack: autoplayErr.stack });
                            }
                        }
                    } catch (e) {
                        logger.error(`queueEnd: Autoplay setup failed: ${e.message}`);
                    }
                }

                // Schedule cleanup if no new tracks were added
                const cleanTimeout = guildSettings.cleanTimeout || 60000;
                
                setTimeout(async () => {
                    try {
                        // Re-check player state after timeout
                        if (!player || player.destroyed) {
                            logger.debug('queueEnd cleanup: Player already destroyed');
                            return;
                        }

                        // Check if player is idle (not playing and queue is empty)
                        if (!player.playing && !player.paused && player.queue.size === 0) {
                            logger.info(`queueEnd cleanup: Destroying idle player in ${guildName}`);
                            
                            if (channel && channel.send) {
                                try {
                                    await channel.send(rejectMessage(`Nothing left in the queue.\nPlayer stopped.\n-# Tip: enable autoplay`));
                                } catch (sendErr) {
                                    logger.error(`queueEnd: Failed to send cleanup message: ${sendErr.message}`);
                                }
                            }
                            
                            player.destroy('queue empty and idle');
                        } else {
                            logger.debug(`queueEnd cleanup: Player still active (playing: ${player.playing}, paused: ${player.paused}, queue: ${player.queue.size})`);
                        }
                    } catch (cleanupErr) {
                        logger.error(`queueEnd cleanup error: ${cleanupErr.message}`);
                    }
                }, cleanTimeout);

            } catch (err) {
                logger.error(`queueEnd handler error: ${err.message}`, { stack: err.stack });
            }
        });
    }
};