const logger = require('../../structures/logger');
const { hakariPlayerCard } = require('../../structures/builders');
const { EMOJIS } = require('../../structures/emojis');
const { getPlayerMsg } = require('../../structures/db');

function msToTime(ms) {
    if (!ms || ms < 0) return '00:00';
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function buildProgressBar(current = 0, total = 0, length = 12) {
    if (!total || total <= 0) return '●───────────────────';
    const filled = Math.round((current / total) * length);
    const empty = length - filled;
    return '▬'.repeat(Math.max(filled - 1, 0)) + EMOJIS.progressbar.dot + '─'.repeat(Math.max(empty, 0));
}

module.exports = {
    name: 'playerUpdate',
    register: (client) => {
        client.manager.on('playerUpdate', async (player, track, payload) => {
            try {
                // Validate player state
                if (!player || player.destroyed) {
                    return;
                }

                // Only update if playing or paused
                if (!player.playing && !player.paused) {
                    return;
                }

                // Check if there's a message to update
                let msg = player.msg;
                if (!msg && !player.msgFetchAttempted) {
                    player.msgFetchAttempted = true;
                    try {
                        const oldMsgData = await getPlayerMsg(player.guildId);
                        if (oldMsgData && oldMsgData.msgId && oldMsgData.channelId) {
                            const channel = client.channels.cache.get(oldMsgData.channelId);
                            if (channel) {
                                msg = await channel.messages.fetch(oldMsgData.msgId).catch(() => null);
                                if (msg) player.msg = msg;
                            }
                        }
                    } catch (e) {
                        logger.debug(`playerUpdate: failed to recover msg from db: ${e.message}`);
                    }
                }

                if (!msg || !msg.editable) {
                    return;
                }

                // Skip if lyrics are being displayed
                if (player.HandleByLyrics) {
                    return;
                }

                // Validate track exists
                if (!track) {
                    logger.debug('playerUpdate: No track data available');
                    return;
                }

                // Safely extract position and duration with fallbacks
                const position = payload?.state?.position ?? player.position ?? 0;
                const trackDuration = track?.duration ?? 0;
                
                // Validate duration is reasonable
                if (trackDuration <= 0 && position <= 0) {
                    return;
                }

                const progressBar = buildProgressBar(position, trackDuration);
                const currentTime = msToTime(position);
                const duration = msToTime(trackDuration);
                const queueSize = player.queue?.size ?? player.queue?.length ?? 0;
                const status = player.paused ? 'Paused' : 'Playing';
                const pauseEmoji = player.paused 
                    ? EMOJIS.music.play 
                    : EMOJIS.music.pause;
                
                // Safely get track title with fallback
                const trackTitle = track?.title ? track.title.slice(0, 32) : 'Unknown';
                const trackUri = track?.uri || '#';
                const trackAuthor = track?.author || 'Unknown';
                const trackThumbnail = track?.thumbnail || 'https://files.catbox.moe/fnlch5.jpg';
                
                const sectionContent = [
                  `### ${EMOJIS.bot.hakariAnimated} Now Playing`,
                  `**[${trackTitle}](${trackUri})**`,
                  `${trackAuthor} — \`${duration}\``,
                ].join('\n');
                
                const bodyContent = `${progressBar} \`${currentTime} / ${duration}\`\n-# ${queueSize > 0 ? `${queueSize} song${queueSize !== 1 ? 's' : ''} in queue` : 'No songs in queue'}`;
                                
                // Update message with error handling
                await msg.edit(hakariPlayerCard({
                  sectionContent,
                  bodyContent,
                  thumbnailURL: trackThumbnail,
                })).catch(err => {
                    // Only log if it's not a known Discord API error
                    if (!err.message?.includes('Unknown Message') && 
                        !err.message?.includes('Missing Access')) {
                        logger.debug(`playerUpdate: Message edit failed: ${err.message}`);
                    }
                    // If message is no longer editable, clear reference
                    if (err.message?.includes('Unknown Message')) {
                        player.msg = null;
                    }
                });

            } catch (err) {
                // Don't log common errors too verbosely
                if (!err.message?.includes('Unknown Message') && 
                    !err.message?.includes('Missing Access')) {
                    logger.error(`playerUpdate error: ${err.message}`, { stack: err.stack });
                } else {
                    logger.debug(`playerUpdate: Expected error: ${err.message}`);
                }
            }
        });
    }
};