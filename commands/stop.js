module.exports = {
    name: "stop",
    aliases: ["dc", "leave"],
/**
 * Stops the music player and disconnects it from the voice channel.
 * @param {Client} client - The client instance.
 * @param {Message} message - The message instance.
 * @param {string[]} args - The command arguments.
 * @returns {Promise<Message>} - The promise of the message reply.
 */
    execute: async (client, message, args) => {
        const player = client.manager.players.get(message.guild.id);
        if (!player) {
            return await message.reply({
                flags: 32768,
                components: [{
                    type: 17,
                    components: [{
                        type: 10,
                        content: "No active player."
                    }]
                }]
            });
        }

        if (!message.member.voice.channel) {
            return await message.reply({
                flags: 32768,
                components: [{
                    type: 17,
                    components: [{
                        type: 10,
                        content: "You must be in a voice channel."
                    }]
                }]
            });
        }

        player.queue.clear();
        player.destroy();

        await message.reply({
            flags: 32768,
            components: [{
                type: 17,
                components: [{
                    type: 10,
                    content: "Stopped and disconnected."
                }]
            }]
        });
    }
};
