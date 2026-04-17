// events/moonlink/trackError.js

const { log } = require("style-logs");

module.exports = {
    // BUG FIX: filename is trackError.js but name was "trackException" — moonlink
    // fires "trackError" for playback failures. Use the correct event name.
    name: "trackError",
    execute: async (client, player, track, error) => {
        const title = track?.title ?? "Unknown";
        const msg = error?.message ?? String(error);
        log(`{border: red}Track "${title}" encountered an error: ${msg}.{/}`);

        // Attempt to skip the broken track so playback can continue
        try {
            if (player?.skip) player.skip();
        } catch (err) {
            console.warn("[TRACK ERROR] Failed to skip after error:", err.message);
        }
    },
};