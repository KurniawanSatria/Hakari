const logger = require('../../structures/logger');

module.exports = {
name: 'queueEnd',
register: (client) => {
client.manager.on('queueEnd', async (player, lastTrack) => {
try {
if (!player || player.destroyed) return;
const guildId = player.guildId;
const channel = client.channels?.cache.get(player.textChannelId);
logger.info(`[queueEnd] Queue ended for guild ${guildId}`);
if (player.autoPlay && lastTrack) {
logger.info(`[queueEnd] Attempting autoplay for ${lastTrack.title}`);
try {
const node = client.manager?.node;
if (node?.handleAutoPlay) {
await node.handleAutoPlay(player, lastTrack);
logger.info(`[queueEnd] Autoplay triggered`);
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
logger.info(`[queueEnd] Added autoplay track: ${nextTrack.title}`);
}
}
} catch (e) {
logger.error(`[queueEnd] Autoplay failed: ${e.message}`);
}
}

const config = require('../../structures/config');
setTimeout(() => {
if (player && !player.destroyed && !player.playing && player.queue.size === 0) {
logger.info(`[queueEnd] No new tracks, destroying player`);
if (channel) {
channel.send({flags:32768,components:[{type: 17,components:[{type:10,content:"**<:hakari:1482121759330275400> Hakari Music**"},{type: 14,ndivider: true,spacing: 1},{type: 10,content:`Nothing left in the queue.
Player stopped.
-# Tip: enable autoplay`}],accent_color: 16687280}]})
}
player.destroy('queue empty');
}
}, config.cleanTimeout || 15000);

} catch (err) {
logger.error(`[queueEnd] ${err.message}`);
}
});
}
};