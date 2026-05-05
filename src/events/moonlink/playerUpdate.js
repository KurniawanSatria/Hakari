const logger = require('../../structures/logger');
const { hakariPlayerCard } = require('../../structures/builders');
const { EMOJIS } = require('../../structures/emojis');

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
                if (!player || player.destroyed) {
                    return;
                }
                if (!player.playing && !player.paused) {
                    return;
                }
                let msg = player.msg;
                if (!msg && !player.msgFetchAttempted) {
                    player.msgFetchAttempted = true;
                    try {
                        const playerMsgData = global.db.data.guilds[player.guildId].message;
                        if (playerMsgData?.id && playerMsgData?.channelId) {
                            const channel = client.channels.cache.get(playerMsgData.channelId);
                            if (channel) {
                                msg = await channel.messages.fetch(playerMsgData.id).catch(() => null);
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

                if (player.HandleByLyrics) {
                    return;
                }
                if (!track) {
                    logger.debug('playerUpdate: No track data available');
                    return;
                }

                const position = payload?.state?.position ?? player.position ?? 0;
                const trackDuration = track?.duration ?? 0;
                if (trackDuration <= 0 && position <= 0) {
                    return;
                }

                const progressBar = buildProgressBar(position, trackDuration);
                const currentTime = msToTime(position);
                const duration = msToTime(trackDuration);
                const queueSize = player.queue?.size ?? player.queue?.length ?? 0;
                const status = player.paused ? 'Paused' : 'Playing';
                const pauseEmoji = player.paused ? EMOJIS.music.play : EMOJIS.music.pause;
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
                await msg.edit(hakariPlayerCard({
                  sectionContent,
                  bodyContent,
                  thumbnailURL: trackThumbnail,
                })).catch(err => {
                    if (!err.message?.includes('Unknown Message') && 
                        !err.message?.includes('Missing Access')) {
                        logger.debug(`playerUpdate: Message edit failed: ${err.message}`);
                    }
                    if (err.message?.includes('Unknown Message')) {
                    }
                });

            } catch (err) {
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