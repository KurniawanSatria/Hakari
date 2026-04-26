const logger = require('../../structures/logger');
const { hakariPlayerCard } = require('../../structures/builders');

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
    return '▬'.repeat(Math.max(filled - 1, 0)) + '<:dot:1498023441649897503>' + '─'.repeat(Math.max(empty, 0));
}

module.exports = {
    name: 'playerUpdate',
    register: (client) => {
        client.manager.on('playerUpdate', async (player, track, payload) => {
            try {
                if (!player || player.destroyed) return;
                if (!player.playing && !player.paused) return;
                const msg = player.msg;
                if (!msg || !msg.editable) return;
                if (player.HandleByLyrics) return;

                const position = payload?.state?.position ?? player.position ?? 0;
                const trackDuration = track?.duration ?? 0;
                const progressBar = buildProgressBar(position, trackDuration);
                const currentTime = msToTime(position);
                const queueSize = player.queue?.size ?? player.queue?.length ?? 0;
                const duration = msToTime(trackDuration);
                const status = player.paused ? 'Paused' : 'Playing';
                const pauseEmoji = player.paused ? { name: 'play', id: '1449501267847151707' } : { name: 'pause', id: '1449501265720774656' };
                                
                const sectionContent = [
                  `### <a:hakari:1497764150099574904> Now Playing`,
                  `**[${track?.title.slice(0, 32) || 'Unknown'}](${track?.uri})**`,
                  `${track?.author} — \`${duration}\``,
                ].join('\n');
                const bodyContent = `${progressBar} \`${currentTime} / ${duration}\`\n-# ${queueSize > 0 ? `${queueSize} song${queueSize !== 1 ? 's' : ''} in queue` : 'No songs in queue'}`;
                                
                await msg.edit(hakariPlayerCard({
                  sectionContent,
                  bodyContent,
                  thumbnailURL: track?.thumbnail || 'https://files.catbox.moe/fnlch5.jpg',
                }));
            } catch (err) {
                logger.error(`in playerUpdate: ${err.message}`)
            }
        });
    }
};