// commands/queue.js

const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "queue",
    aliases: ["q"],
/**
 * Get the current queue of the music player.
 * If there are no tracks in the queue, an error message will be sent.
 * @param {Client} client The Discord client.
 * @param {Message} message The message that triggered the command.
 */
    execute: async (client, message) => {
        try {
            const player = client.manager.players.get(message.guild.id);
            if (!player) {
                return await message.reply({flags: 32768, components: [{type: 17, components: [{type: 10, content: "No active player!"}]}]});
            }

            if (!player.current && player.queue.size === 0) {
                return await message.reply({flags: 32768, components: [{type: 17, components: [{type: 10, content: "There are no tracks in the queue!"}]}]});
            }

/**
 * Format a duration in milliseconds to a human-readable string.
 * The string will be in the format of HH:MM:SS, where HH is the number of hours,
 * MM is the number of minutes and SS is the number of seconds.
 * If the duration is less than 1 hour, the HH part will be omitted.
 * @param {number} ms The duration in milliseconds.
 * @returns {string} The formatted duration string.
 */
            const formatDuration = (ms) => {
                const seconds = Math.floor((ms / 1000) % 60);
                const minutes = Math.floor((ms / (1000 * 60)) % 60);
                const hours = Math.floor(ms / (1000 * 60 * 60));

                return `${hours ? `${hours}:` : ""}${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
            };

            const embed = new EmbedBuilder().setTitle("Current Queue").setColor("#FD7CAC");

            if (player.current) {
                embed.setDescription(
                    `**Now Playing:**\n[${player.current.title}](${player.current.uri}) | \`${formatDuration(player.current.duration)}\``
                );
            }

            if (player.queue.size > 0) {
                const tracks = player.queue.tracks.map((track, index) => {
                    return `${index + 1}. [${track.title}](${track.uri}) | \`${formatDuration(track.duration)}\``;
                });

                embed.addFields({ name: "Up Next:", value: tracks.slice(0, 10).join("\n") });

                if (player.queue.size > 10) {
                    embed.addFields({ name: "And more...", value: `${player.queue.size - 10} more tracks in the queue` });
                }
            }

            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error("[QUEUE CMD] Error:", error);
            await message.reply("An error occurred while fetching the queue.");
        }
    }
}
