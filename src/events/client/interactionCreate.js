// src/events/client/interactionCreate.js - Button interactions

const logger = require('../../structures/logger');

module.exports = {
name: 'interactionCreate',
execute: async (client, interaction) => {
try {
// Only handle buttons
if (!interaction.isButton()) return;

if (!client.manager) {
return interaction.reply({
content: 'Music not initialized.',
ephemeral: true
});
}

const player = client.manager.players.get(interaction.guildId);
if (!player) {
return interaction.reply({
content: 'No active player.',
ephemeral: true
});
}

const { customId } = interaction;

switch (customId) {
case 'stop':{
// Clean up lyrics
if (player.lyricsMsg) {
player.lyricsMsg.delete().catch(() => { });
player.lyricsMsg = null;
}
player.lyricsData = null;
player.lyricsLines = null;
player.HandleByLyrics = false;

// Clean up track message
if (player.msg?.delete) {
player.msg.delete().catch(() => { });
}
player.msg = null;
player.queue.clear();
await player.destroy();
msg = await interaction.reply({flags:32768,components:[{type: 17,components:[{type:10,content:"**<:hakari:1482121759330275400> Hakari Music**"},{type: 14,ndivider: true,spacing: 1},{type: 10,content:`Stopped by <@${interaction.user.id}>.`}],accent_color: 16687280}]});
setTimeout(() => {
msg.delete().catch(() => { })
}, 3000) 
}
break;

case 'skip':{
const title = player.current?.title || 'track';
player.skip();
let msg = await interaction.reply({flags:32768,components:[{type: 17,components:[{type:10,content:"**<:hakari:1482121759330275400> Hakari Music**"},{type: 14,ndivider: true,spacing: 1},{type: 10,content:`Skipped ${title} by <@${interaction.user.id}>.`}],accent_color: 16687280}]});
setTimeout(() => {
msg.delete().catch(() => { })
}, 3000) 
}
break;

case 'pause_resume':{
let msg;
if (player.paused) {
player.resume();
const title = player.current?.title || 'track';
msg = await interaction.reply({flags:32768,components:[{type: 17,components:[{type:10,content:"**<:hakari:1482121759330275400> Hakari Music**"},{type: 14,ndivider: true,spacing: 1},{type: 10,content:`Resumed ${title} by <@${interaction.user.id}>.`}],accent_color: 16687280}]});
} else {
player.pause();
msg = await interaction.reply({
content: '⏸ Paused.',
ephemeral: true
});
setTimeout(() => {
msg.delete().catch(() => { })
}, 3000) 
}
}
break;

case 'previous':{
let msg;
const wentBack = await player.back();
if (wentBack) {
msg = await interaction.reply({flags:32768,components:[{type: 17,components:[{type:10,content:"**<:hakari:1482121759330275400> Hakari Music**"},{type: 14,ndivider: true,spacing: 1},{type: 10,content:`<@${interaction.user.id}> went back.`}],accent_color: 16687280}]});
} else {
msg = await interaction.reply({flags:32768,components:[{type: 17,components:[{type:10,content:"**<:hakari:1482121759330275400> Hakari Music**"},{type: 14,ndivider: true,spacing: 1},{type: 10,content:'No previous track.'}],accent_color: 16687280}]});
}
setTimeout(() => {
msg.delete().catch(() => { })
}, 3000) 
}
break;

case 'queue':{
const queue = player.queue;
let msg;
if (queue && queue.size > 0) {
const queueList = queue.tracks.slice(0, 10).map((t, i) =>
`${i + 1}. [${t.title} - ${t.author}](${t.uri})`
).join('\n');
msg = await interaction.reply({flags:32768,components:[{type: 17,components:[{type:10,content:"**<:hakari:1482121759330275400> Hakari Music**"},{type: 14,ndivider: true,spacing: 1},{type: 10,content:`**Queue:**\n${queueList}${queue.size > 10 ? `\n... and ${queue.size - 10} more` : ''}`}],accent_color: 16687280}]});
} else {
msg = await interaction.reply({
content: 'Queue is empty.',
ephemeral: true
});
}
setTimeout(() => {
msg.delete().catch(() => { })
}, 3000) 
}
break;

case 'shuffle':{
let msg;
if (player.queue && player.queue.size > 1) {
player.shuffle();
msg = await interaction.reply({flags:32768,components:[{type: 17,components:[{type:10,content:"**<:hakari:1482121759330275400> Hakari Music**"},{type: 14,ndivider: true,spacing: 1},{type: 10,content:`Queue shuffled by <@${interaction.user.id}>.`}],accent_color: 16687280}]});
} else {
msg = await interaction.reply({flags:32768,components:[{type: 17,components:[{type:10,content:"**<:hakari:1482121759330275400> Hakari Music**"},{type: 14,ndivider: true,spacing: 1},{type: 10,content:'Queue is too short to shuffle.'}],accent_color: 16687280}]});
}
setTimeout(() => {
msg.delete().catch(() => { })
}, 3000) 
}
break;

case 'loop':{
let msg;
const currentLoop = player.loop;
let newLoop;
if (currentLoop === 'track') {
newLoop = 'queue';
} else if (currentLoop === 'queue') {
newLoop = null;
} else {
newLoop = 'track';
}
player.setLoop(newLoop);
if (newLoop) {
msg = await interaction.reply({flags:32768,components:[{type: 17,components:[{type:10,content:"**<:hakari:1482121759330275400> Hakari Music**"},{type: 14,ndivider: true,spacing: 1},{type: 10,content: `<@${interaction.user.id}> changed loop mode to ${newLoop}.`}],accent_color: 16687280}]});
} else {
msg = await interaction.reply({flags:32768,components:[{type: 17,components:[{type:10,content:"**<:hakari:1482121759330275400> Hakari Music**"},{type: 14,ndivider: true,spacing: 1},{type: 10,content:`<@${interaction.user.id}> disabled loop mode.`}],accent_color: 16687280}]});
}
}
break;

case 'volume_up': {
const current = Math.min(player.volume ?? 100, 100)
let content
if (current >= 100) {
content = '🔊 Already max.'
} else {
const newVol = Math.min(current + 10, 100)
player.setVolume(newVol)
content = `<@${interaction.user.id}> changed the volume to \`🔊 ${newVol}%\``
}
let msg =await interaction.reply({flags:32768,components:[{type: 17,components:[{type:10,content:"**<:hakari:1482121759330275400> Hakari Music**"},{type: 14,ndivider: true,spacing: 1},{type: 10,content}],accent_color: 16687280}]})
setTimeout(() => {
msg.delete().catch(() => { })
}, 3000)
}
break


case 'volume_down': {
const current = Math.max(player.volume ?? 100, 0)
let content
if (current <= 0) {
content = '🔉 Already mute.'
} else {
const newVol = Math.max(current - 10, 0)
player.setVolume(newVol)
content = `@${interaction.user.id}> changed the volume to \`🔉 ${newVol}%\``
}
let msg = await interaction.reply({flags:32768,components:[{type: 17,components:[{type:10,content:"**<:hakari:1482121759330275400> Hakari Music**"},{type: 14,ndivider: true,spacing: 1},{type: 10,content}],accent_color: 16687280}]})
setTimeout(() => {
msg.delete().catch(() => { })
}, 3000)
}
break


case 'lyrics':
if (player.current) {
await player.subscribeLyrics()
let msg = await interaction.reply({flags:32768,components:[{type: 17,components:[{type:10,content:"**<:hakari:1482121759330275400> Hakari Music**"},{type: 14,ndivider: true,spacing: 1},{type: 10,content: 'Loading...'}],accent_color: 16687280}]})
player.pendingLyricsMsg = msg;
} else {
await interaction.reply({flags:32768,components:[{type: 17,components:[{type:10,content:"**<:hakari:1482121759330275400> Hakari Music**"},{type: 14,ndivider: true,spacing: 1},{type: 10,content:'no track playing.'}],accent_color: 16687280}]});
}
break;

default:
logger.warn(`Unknown button: ${customId}`);
}

} catch (err) {
logger.error(`[interaction] ${err.message}`);
if (!interaction.replied) {
interaction.reply({
content: 'Error processing interaction.',
ephemeral: true
}).catch(() => { });
}
}
}
};