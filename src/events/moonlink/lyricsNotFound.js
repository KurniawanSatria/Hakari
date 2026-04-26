const logger = require('../../structures/logger');
module.exports = {
name: 'lyricsNotFound',
register: (client) => {
client.manager.on('lyricsNotFound', async (player, payload) => {
try {
if (!player || player.destroyed) return;
const title = player.current?.title || 'Unknown';
const author = player.current?.author || 'Unknown';
const guildName = client.guilds?.cache.get(player.guildId)?.name || 'Unknown';
const channelName = client.channels?.cache.get(player.textChannelId)?.name || 'Unknown';
logger.error(`Lyrics Not Found for ${title} by ${author} in ${guildName} (${channelName})`);
player.lyricsData = null;
player.lyricsLines = null;
player.current.lyrics_provider = 'Unknown';
} catch (err) {
logger.error(`in lyricsNotFound: ${err.message}`);
}
});
}
};