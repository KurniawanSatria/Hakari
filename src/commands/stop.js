// src/commands/stop.js - Stop command

const { errorMsg, successMsg } = require('../structures/components');

module.exports = {
name: 'stop',
aliases: ['leave', 'disconnect'],
execute: async (client, message, args) => {
try {
const player = client.manager?.players.get(message.guild.id);
if (!player) {
return message.channel.send(errorMsg('No Player', 'No active player in this server.'));
}
// Clean up lyrics
if (player.lyricsMsg) {
player.lyricsMsg.delete().catch(() => { });
player.lyricsMsg = null;
}
player.lyricsData = null;
player.lyricsLines = null;

// Clean up track message
if (player.msg?.delete) {
player.msg.delete().catch(() => { });
}
player.msg = null;
const queueSize = player.queue.size;
player.queue.clear();
await player.destroy();


} catch (err) {
message.channel.send(errorMsg('Error', 'Error stopping.'));
}
}
};