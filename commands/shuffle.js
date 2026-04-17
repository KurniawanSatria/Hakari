module.exports = {
    name: "shuffle",
    aliases: ["mix"],
/**
 * Shuffles the queue.
 *
 * @param {Client} client - The client.
 * @param {Message} message - The message.
 * @param {string[]} args - The arguments.
 */
    execute: async (client, message, args) => {
        try {
            const player = client.manager.players.get(message.guild.id);
            if (!player) {
                return await message.reply({flags: 32768, components: [{type: 17, components: [{type: 10, content: "No active player!"}]}]});
            }
            if (!message.member.voice.channel) {
                return await message.reply({flags: 32768, components: [{type: 17, components: [{type: 10, content: "You must be in a voice channel!"}]}]});
            }
            if (player.queue.size < 2) {
                return await message.reply({flags: 32768, components: [{type: 17, components: [{type: 10, content: "The queue must have at least 2 tracks to shuffle."}]}]});
            }

            player.queue.shuffle();
            await message.reply({flags: 32768, components: [{type: 17, components: [{type: 10, content: "<:shuffle:1477753801755230269> Shuffled the queue."}]}]});
        } catch (error) {
            console.error("[SHUFFLE CMD] Error:", error);

            await message.reply({ flags: 32768, components: [{type: 17, components: [{type: 10, content: "An error occurred while shuffling the queue."}]}] }).catch(() => { });
        }
    },
};
