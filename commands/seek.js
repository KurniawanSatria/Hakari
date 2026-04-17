module.exports = {
    name: "seek",
    aliases: ["jump", "goto"],
        /**
         * Seek to a specific position in the currently playing track.
         * @param {Message} message - The message object.
         * @param {string[]} args - The arguments passed to the command.
         * @example
         * // Seek to 1 minute and 30 seconds
         * message.channel.send({ content: "!seek 1:30" });
         * @example
         * // Seek to 90 seconds
         * message.channel.send({ content: "!seek 90" });
         */
    execute: async (client, message, args) => {
        try {
            const player = client.manager.players.get(message.guild.id);
            if (!player) {
                return await message.reply({flags: 32768, components: [{type: 17, components: [{type: 10, content: "No active player!"}]}]});
            }
            if (message.member.voice.channel?.id !== player.voiceChannelId) {
                return await message.reply({flags: 32768, components: [{type: 17, components: [{type: 10, content: "You must be in the same voice channel!"}]}]});
            }
            if (!player.current) {
                return await message.reply({flags: 32768, components: [{type: 17, components: [{type: 10, content: "Nothing is playing!"}]}]});
            }
            if (!player.current.isSeekable) {
                return await message.reply({flags: 32768, components: [{type: 17, components: [{type: 10, content: "This track cannot be seeked!"}]}]});
            }
            const position = args.join(" ");
            if (!position) {
                return await message.reply({flags: 32768, components: [{type: 17, components: [{type: 10, content: "Please specify a position! Use the format `mm:ss` or `seconds`."}]}]});
            }
            let milliseconds = 0;
            if (position.includes(":")) {
                const [minutes, seconds] = position.split(":");
                milliseconds = (parseInt(minutes) * 60 + parseInt(seconds)) * 1000;
            } else {
                milliseconds = parseInt(position) * 1000;
            }
            if (isNaN(milliseconds)) {
                return await message.reply({flags: 32768, components: [{type: 17, components: [{type: 10, content: "Invalid time format! Please use the format `mm:ss` or `seconds`."}]}]});
            }
            if (milliseconds > player.current.duration) {
                return await message.reply({flags: 32768, components: [{type: 17, components: [{type: 10, content: `Track is only ${formatDuration(player.current.duration)} long!`}]}]});
            }

            player.seek(milliseconds);
            await message.reply({flags: 32768, components: [{type: 17, components: [{type: 10, content: `Seeked to: **${formatDuration(milliseconds)}**`}]}]});
        } catch (error) {
            console.error("[SEEK CMD] Error:", error);

            await message.reply({ flags: 32768, components: [{type: 17, components: [{type: 10, content: "An error occurred while seeking the track."}]}] }).catch(() => { });
        }
    },
};

function formatDuration(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));
    return `${hours ? `${hours}:` : ""}${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
}