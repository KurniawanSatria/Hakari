// events/client/voiceStateUpdate.js

const config = require("../../config");

module.exports = {
    name: "voiceStateUpdate",
/**
 * Handles the voiceStateUpdate event.
 *
 * If the bot is disconnected or leaves the voice channel, it will destroy the player and
 * clear the queue if 24/7 mode is not enabled.
 *
 * @param {Client} client - The client instance.
 * @param {VoiceState} oldVoiceState - The old voice state of the bot.
 * @param {VoiceState} newVoiceState - The new voice state of the bot.
 */
    execute: (client, oldVoiceState, newVoiceState) => {
        // Only care if it's the bot itself
        if (newVoiceState.member.user.id !== client.user.id) return;

        // Bot was disconnected or left the voice channel
        if (oldVoiceState.channelId && !newVoiceState.channelId) {
            const guildId = oldVoiceState.guild.id;
            const player = client.manager.players.get(guildId);
            if (!player) return;


            // Otherwise, disconnect as usual
            player.destroy();
        }
    },
};
