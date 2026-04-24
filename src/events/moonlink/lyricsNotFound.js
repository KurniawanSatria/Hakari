const logger = require('../../structures/logger');
module.exports = {
name: 'lyricsNotFound',
register: (client) => {
client.manager.on('lyricsNotFound', async (player, payload) => {
try {
if (!player || player.destroyed) return;
const title = player.current?.title || 'Unknown';
console.error(`[lyricsNotFound] ${title} (${player.guildId})`);
player.lyricsData = null;
player.lyricsLines = null;
player.current.lyrics_provider = 'Unknown';
} catch (err) {
console.error(`[lyricsNotFound] ${err.message}`);
}
});
}
};