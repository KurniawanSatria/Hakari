// src/commands/queue.js - Queue command

const { queueList, errorMsg } = require('../structures/components');

function formatDuration(ms) {
if (!ms || isNaN(ms)) return 'Unknown';
const totalSec = Math.floor(ms / 1000);
const h = Math.floor(totalSec / 3600);
const m = Math.floor((totalSec % 3600) / 60);
const s = totalSec % 60;
if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
return `${m}:${String(s).padStart(2, '0')}`;
}

module.exports = {
name: 'queue',
aliases: ['q', 'list'],
execute: async (client, message, args) => {
try {
const player = client.manager?.players.get(message.guild.id);
if (!player) {
return message.channel.send(errorMsg('No Player', 'No active player in this server.'));
}
const queue = player.queue.tracks || [];
const current = player.current;
if (!current && queue.length === 0) {
return message.channel.send(errorMsg('Empty Queue', 'Queue is empty.'));
}

const totalDuration = queue.reduce((a, t) => a + (t.duration || 0), 0);
await message.channel.send(queueList(current, queue, formatDuration(totalDuration)));

} catch (err) {
message.channel.send(errorMsg('Error', 'Error displaying queue.'));
}
}
};