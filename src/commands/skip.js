// src/commands/skip.js - Skip command

const { errorMsg, successMsg } = require('../structures/components');

module.exports = {
name: 'skip',
aliases: ['s', 'next'],
execute: async (client, message, args) => {
try {
const player = client.manager?.players.get(message.guild.id);
if (!player || !player.current) {
return message.channel.send(errorMsg('No Track', 'No track currently playing.'));
}

const title = player.current.title;
player.skip();

message.channel.send(successMsg(`Skipped **${title}**`));

} catch (err) {
message.channel.send(errorMsg('Error', 'Error skipping track.'));
}
}
};