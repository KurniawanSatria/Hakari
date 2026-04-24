const logger = require('../../structures/logger');

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
return '▬'.repeat(Math.max(filled - 1, 0)) + '🔘' + '─'.repeat(Math.max(empty, 0));
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
const status = player.paused ? 'Paused' : 'Playing';
const pauseEmoji = player.paused ? { name: 'play',  id: '1449501267847151707' } : { name: 'pause', id: '1449501265720774656' };
await msg.edit({
flags: 32768,
components: [
{
type: 17,
components: [
{
type: 12,
items: [{ media: { url: 'https://i.ibb.co.com/tpZ2Vg8P/Now-Playing.gif' } }]
},
{
type: 9,
components: [
{
type: 10,
content: [
`## ${track?.title || 'Unknown'}`,
'',
`**${track?.title || 'Unknown'} - ${track?.author || 'Unknown'}**`,
`\`${progressBar}\``,
`-# ${status} | \`${currentTime}\``,
'',
`-# ${player.queue?.size ?? 0} song${player.queue?.size !== 1 ? 's' : ''} in queue`,
`-# Requester: **${track?.requester?.username || 'Unknown'}**`
].join('\n')
}
],
accessory: { type: 11, media: { url: track?.thumbnail || 'https://files.catbox.moe/fnlch5.jpg' } }
},
{ type: 14 },
{
type: 1,
components: [
{ style: 4, type: 2, custom_id: 'stop', emoji: { id: '1449501286360944853', name: 'stop' } },
{ style: 2, type: 2, custom_id: 'previous', emoji: { name: 'previous', id:'1449501284272181309' } },
{ style: 2, type: 2, custom_id: 'pause_resume', emoji: pauseEmoji },
{ style: 2, type: 2, custom_id: 'skip', emoji: { id: '1449501258791518370', name: 'skip' } },
{ style: 2, type: 2, custom_id: 'queue', emoji: { name: 'queue', id: '1451682061697159310' } }
]
},
{
type: 1,
components: [
{ style: 2, type: 2, custom_id: 'shuffle', emoji: { name: 'shuffle', id: '1449501276131033219' } },
{ style: 2, type: 2, custom_id: 'loop', emoji: { name: 'loop', id: '1449501269818609876' } },
{ style: 2, type: 2, custom_id: 'volume_down', emoji: { name: 'volume down', id: '1449501262642020442' } },
{ style: 2, type: 2, custom_id: 'volume_up', emoji: { name: 'volume up', id: '1449501288869138482' } },
{ style: 2, type: 2, custom_id: 'lyrics', emoji: { name: 'lyrics', id: '1482110308435628153' } }
]
}
]
}
]
});
} catch (err) {
console.log(`[playerUpdate] ${err.message}`)
}
});
}
};