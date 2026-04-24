const logger = require('../../structures/logger');
module.exports = {
name: 'lyricsNotFound',
register: (client) => {
client.manager.on('lyricsNotFound', async (player, payload) => {
try {
if (!player || player.destroyed) return;
const title = player.current?.title || 'Unknown';
logger.info(`[lyricsNotFound] ${title} (${player.guildId})`);
player.lyricsData = null;
player.lyricsLines = null;
} catch (err) {
logger.error(`[lyricsNotFound] ${err.message}`);
}
});
}
};