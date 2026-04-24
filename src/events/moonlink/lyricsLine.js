const logger = require('../../structures/logger');
//const {node} = require('../../index');
const CONTEXT = 2;

function getLineText(line) {
if (!line) return '';
if (typeof line === 'string') return line;
if (line.segments && Array.isArray(line.segments)) {
return line.segments.map(s => s.text || '').join('');
}
return line.text || line.line || '';
}
function randomColoransi() {
  const colors = [
    "\x1b[31m",
    "\x1b[32m",
    "\x1b[33m",
    "\x1b[34m",
    "\x1b[35m",
    "\x1b[36m",
    "\x1b[91m",
    "\x1b[92m",
    "\x1b[93m",
    "\x1b[94m",
    "\x1b[95m",
    "\x1b[96m"
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

function formatLyricsAnsi(lyricsDisplay) {
  const bold = "\x1b[1m"
  const reset = "\x1b[0m"
  const color = randomColoransi()

  return `${color}${bold}${lyricsDisplay}${reset}`
}
function formatTime(ms) {
if (!ms || ms < 0) return '0:00';
const totalSec = Math.floor(ms / 1000);
const m = Math.floor(totalSec / 60);
const s = totalSec % 60;
return `${m}:${String(s).padStart(2, '0')}`;
}

function buildProgressBar(current = 0, total = 0, length = 12) {
if (!total || total <= 0) return '●───────────────────';
const filled = Math.round((current / total) * length);
const empty = length - filled;
return '▬'.repeat(Math.max(filled - 1, 0)) + '🔘' + '─'.repeat(Math.max(empty, 0));
}

function buildLyricsDisplay(lines, currentIdx, lineText) {
if (currentIdx >= 0 && lines.length > 0) {
const before = [];
for (let i = Math.max(0, currentIdx - CONTEXT); i < currentIdx; i++) {
const t = getLineText(lines[i]);
if (t) before.push(`-# ~~${t}~~`);
}

const current = getLineText(lines[currentIdx]);

const after = [];
for (let i = currentIdx + 1; i < Math.min(lines.length, currentIdx + CONTEXT + 1); i++) {
const t = getLineText(lines[i]);
if (t) after.push(`-# ~~${t}~~`);
}

const parts = [];
if (before.length) parts.push(before.join('\n'));
if (current)       parts.push(`**${current}**`);
if (after.length)  parts.push(after.join('\n'));

return parts.join('\n') || '♪';
}

return lineText || '♪';
}

module.exports = {
name: 'lyricsLine',
register: (client) => {
client.manager.on('lyricsLine', async (player, payload) => {
try {
if (!player || player.destroyed) return;
if (!player.playing && !player.paused) return;
player.HandleByLyrics = true;
const track = player.current;
const msg   = player.msg;
if (!msg || !msg.editable) return;
const thumb     = track?.thumbnail || 'https://files.catbox.moe/fnlch5.jpg';
const title     = track?.title     || 'Unknown';
const author    = track?.author    || 'Unknown';
const requester = track?.requester?.username || 'Unknown';
const duration  = formatTime(track?.duration);
const status    = player.paused ? 'Paused' : 'Playing';
const queueSize = player.queue?.size ?? player.queue?.length ?? 0;
const queueText = queueSize > 0 ? `${queueSize} song${queueSize !== 1 ? 's' : ''} in queue` : 'No songs in queue';
const lineData  = payload?.line;
const lineTime  = lineData?.timestamp;
const lineText  = lineData?.line || '';
const lines     = player.lyricsLines || [];

let currentIdx = -1;
if (payload?.lineIndex !== undefined) {
currentIdx = payload.lineIndex;
} else if (lineTime !== undefined && lines.length > 0) {
currentIdx = lines.findIndex(l =>
l.time <= lineTime && (l.endTime === undefined || l.endTime > lineTime)
);
}
const lyricsDisplay = buildLyricsDisplay(lines, currentIdx, lineText);
const currentMs   = lineTime ?? player.position ?? 0;
const totalMs     = track?.duration ?? 0;
const progressBar = buildProgressBar(currentMs, totalMs);
const currentTime = formatTime(currentMs);
await msg.edit({
flags: 32768,
components: [
{
accent_color: 16687280,
type: 17,
components: [
{
type: 12,
items: [
{
media: {
url: 'https://i.ibb.co.com/ksXKzFg1/Now-Playing.gif'
}
}
],
},
{
type: 9,
components: [
{
type: 10,
content: [
`## ${title}`,
`**${title} - ${author}**`,
`${progressBar}`,
`-# ${status} | \`${currentTime}\``,
`-# ${queueText}`
].join('\n')
}
],
accessory: {
type: 11,
media: { url: thumb }
}
},
{type : 14 },
{
type: 1,
components: [
{
style: 4,
type: 2,
custom_id: 'stop',
emoji: { id: '1449501286360944853', name: 'stop' }
},
{
style: 2,
type: 2,
custom_id: 'previous',
emoji: { name: 'previous', id:'1449501284272181309' }
},
{
style: 2,
type: 2,
custom_id: 'pause_resume',
emoji: { name: 'pause', id:'1449501265720774656' }
},
{
style: 2,
type: 2,
custom_id: 'skip',
emoji: { id: '1449501258791518370', name: 'skip' }
},
{
style: 2,
type: 2,
custom_id: 'queue',
emoji: { name: 'queue', id: '1451682061697159310' }
}
]
},
{
type: 1,
components: [
{
style: 2,
type: 2,
custom_id: 'shuffle',
emoji: { name: 'shuffle', id: '1449501276131033219' }
},
{
style: 2,
type: 2,
custom_id: 'loop',
emoji: { name: 'loop', id: '1449501269818609876' }
},
{
style: 2,
type: 2,
custom_id: 'volume_down',
emoji: { name: 'volume down', id: '1449501262642020442' }
},
{
style: 2,
type: 2,
custom_id: 'volume_up',
emoji: { name: 'volume up', id: '1449501288869138482' }
},
{
style: 2,
type: 2,
custom_id: 'lyrics',
emoji: { name: 'lyrics', id: '1451697663396413481' }, disabled: true
}
]
}
],
},
{
type: 17,
components: [
{type: 10, content: `## <:lyrics:1451697663396413481> Lyrics\n\`\`\`ansi\n${formatLyricsAnsi(lyricsDisplay)}\n\n\`\`\``},
{type: 14, divider: true, spacing: 1},
{type: 10, content: `-# Sourced from: ${track.lyrics_provider}`}
],
accent_color: 16687280
}
]
});

} catch (err) {
console.error(`[lyricsLine] ${err.message}`);
}
});
}
};