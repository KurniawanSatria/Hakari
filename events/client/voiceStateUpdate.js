// events/client/voiceStateUpdate.js

const config = require("../../config");

module.exports = {
    name: "voiceStateUpdate",
    /**
     * Handles the voiceStateUpdate event.
     *
     * If the bot is moved or disconnected from a voice channel:
     * - In 24/7 mode: reconnect to the original channel.
     * - Otherwise: destroy the player and clean up.
     *
     * @param {Client} client
     * @param {VoiceState} oldVoiceState
     * @param {VoiceState} newVoiceState
     */
    execute: async (client, oldVoiceState, newVoiceState) => {
        // Only care about the bot itself
        if (newVoiceState.member?.user?.id !== client.user.id) return;

        // Bot left / was disconnected from a voice channel
        if (oldVoiceState.channelId && !newVoiceState.channelId) {
            const guildId = oldVoiceState.guild.id;
            const player = client.manager?.players?.get(guildId);
            if (!player) return;

            if (config.twentyFourSeven) {
                // Attempt to reconnect to the previous channel
                try {
                    await player.connect();
                } catch (err) {
                    console.warn("[VOICE STATE] Failed to reconnect in 24/7 mode:", err.message);
                    player.destroy();
                }
            } else {
                player.destroy();
            }
        }

        // Bot was moved to a different channel — update the stored voiceChannelId
        if (
            oldVoiceState.channelId &&
            newVoiceState.channelId &&
            oldVoiceState.channelId !== newVoiceState.channelId
        ) {
            const guildId = newVoiceState.guild.id;
            const player = client.manager?.players?.get(guildId);
            if (player) {
                player.voiceChannelId = newVoiceState.channelId;
            }
        }
    },
};