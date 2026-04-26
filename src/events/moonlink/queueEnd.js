const logger = require('../../structures/logger');
const { rejectMessage } = require('../../structures/builders');

module.exports = {
    name: 'queueEnd',
    register: (client) => {
        client.manager.on('queueEnd', async (player, lastTrack) => {
            try {
                if (!player || player.destroyed) return;

                const guildId = player.guildId;
                const channel = client.channels?.cache.get(player.textChannelId);
                const title = lastTrack?.title || 'Unknown';
                const author = lastTrack?.author || 'Unknown';
                const guildName = client.guilds?.cache.get(player.guildId)?.name || 'Unknown';
                const channelName = client.channels?.cache.get(player.textChannelId)?.name || 'Unknown';
                logger.info(`Queue ended for ${guildName} (${channelName})`);
                if (lastTrack) {
                    logger.info(`Attempting autoplay for ${title} by ${author} in ${guildName} (${channelName})`);
                    try {
                        const node = client.manager?.node;
                        if (node?.handleAutoPlay) {
                            await node.handleAutoPlay(player, lastTrack);
                            logger.info(`Autoplay triggered in ${guildName} (${channelName})`);
                        } else {
                            const query = `${lastTrack.author} ${lastTrack.title}`;
                            const result = await client.manager.search({
                                query,
                                requester: lastTrack.requester
                            });

                            if (result?.tracks?.length > 0) {
                                const nextTrack = result.tracks[0];
                                nextTrack.setRequester?.(lastTrack.requester) || (nextTrack.requester = lastTrack.requester);
                                player.queue.add(nextTrack);
                                player.play();
                                logger.info(`Added autoplay track: ${nextTrack.title} by ${nextTrack.author} in ${guildName} (${channelName})`);
                            }
                        }
                    } catch (e) {
                        logger.error(`in queueEnd: Autoplay failed: ${e.message}`);
                    }
                }

                const config = require('../../structures/config');
                setTimeout(() => {
                    if (player && !player.destroyed && !player.playing && player.queue.size === 0) {
                        logger.info(`QueueEnd No new tracks, destroying player`);
                        if (channel) {
                            channel.send(rejectMessage(`Nothing left in the queue.\nPlayer stopped.\n-# Tip: enable autoplay`))
                        }
                        player.destroy('queue empty');
                    }
                }, config.cleanTimeout || 15000);

            } catch (err) {
                logger.error(`in queueEnd: ${err.message}`);
            }
        });
    }
};