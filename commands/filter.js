module.exports = {
    name: "filter",
    aliases: ["effect", "fx"],
    execute: async (client, message, args) => {
        try {
            const player = client.manager.players.get(message.guild.id);
            if (!player) {
                return await message.reply({ flags: 32768, components: [{type: 17, components: [{type: 10, content: "No active player!"}]}] });
            }
            if (message.member.voice.channel?.id !== player.voiceChannelId) {
                return await message.reply({ flags: 32768, components: [{type: 17, components: [{type: 10, content: "You need to be in the same voice channel as the bot!"}]}] });
            }

            const filter = args[0];
            if (!filter) {
                return await message.reply({ flags: 32768, components: [{type: 17, components: [{type: 10, content: "Please specify a filter! Available filters: `reset`, `bassboost`, `nightcore`, `vaporwave`, `8d`, `tremolo`, `vibrato`, `karaoke`" }]}] });
            }
            let replyMessage = null;

            try {
                switch (filter.toLowerCase()) {
                    case "reset":
                        player.filters.clear();
                        await player.filters.apply();
                        replyMessage = "All filters reset.";
                        break;
                    case "bassboost":
                        player.filters.setEqualizer([
                            { band: 0, gain: 0.40 },  // 25Hz
                            { band: 1, gain: 0.40 },  // 40Hz
                            { band: 2, gain: 0.35 },  // 63Hz  → sekitar 60Hz
                            { band: 3, gain: 0.30 },  // 100Hz
                            { band: 4, gain: 0.25 },  // 160Hz → sekitar 150Hz
                            { band: 5, gain: 0.15 },  // 250Hz
                            { band: 6, gain: 0.10 },  // 400Hz
                            { band: 7, gain: 0.05 },  // 630Hz
                            { band: 8, gain: 0.00 },  // 1KHz
                            { band: 9, gain: 0.00 },  // 1.6KHz
                            { band: 10, gain: 0.00 }, // 2.5KHz
                            { band: 11, gain: 0.00 }, // 4KHz
                            { band: 12, gain: 0.00 }, // 6.3KHz
                        ]);
                        replyMessage = "Bassboost filter applied.";
                        break;
                    case "nightcore":
                        player.filters.setTimescale({ speed: 1.2, pitch: 1.2, rate: 1.0 });
                        replyMessage = "Nightcore filter applied.";
                        break;
                    case "vaporwave":
                        player.filters.setTimescale({ speed: 0.8, pitch: 0.8, rate: 1.0 });
                        replyMessage = "Vaporwave filter applied.";
                        break;
                    case "8d":
                        player.filters.setRotation({ rotationHz: 0.2 });
                        replyMessage = "8D filter applied.";
                        break;
                    case "tremolo":
                        player.filters.setTremolo({ frequency: 4.0, depth: 0.75 });
                        replyMessage = "Tremolo filter applied.";
                        break;
                    case "vibrato":
                        player.filters.setVibrato({ frequency: 4.0, depth: 0.75 });
                        replyMessage = "Vibrato filter applied.";
                        break;
                    case "karaoke":
                        player.filters.setKaraoke({
                            level: 1.0,
                            monoLevel: 1.0,
                            filterBand: 220.0,
                            filterWidth: 100.0,
                        });
                        replyMessage = "Karaoke filter applied.";
                        break;
                    default:
                        return await message.reply({ flags: 32768, components: [{type: 17, components: [{type: 10, content: "Invalid filter! Available filters: `reset`, `bassboost`, `nightcore`, `vaporwave`, `8d`, `tremolo`, `vibrato`, `karaoke`" }]}] });
                }

                if (replyMessage) {
                    await player.filters.apply();
                    await message.reply({ flags: 32768, components: [{type: 17, components: [{type: 10, content: replyMessage }]}] });
                }
            } catch (error) {
                console.error("Filter application error:", error);
                await message.reply({ flags: 32768, components: [{type: 17, components: [{type: 10, content: "Failed to apply filter. Please try again."}]}] });
            }
        } catch (error) {
            console.error("[FILTER CMD] Error:", error);

            await message.reply({ flags: 32768, components: [{type: 17, components: [{type: 10, content: "An error occurred while applying the filter."}]}] }).catch(() => { });
        }
    },
};
