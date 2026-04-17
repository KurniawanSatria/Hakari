// events/moonlink/queueEnd.js

const config = require("../../config");

module.exports = {
    name: "queueEnd",
    execute: async (client, player) => {
        // Clean up now-playing message
        const msg = player?.msg;
        player.msg = null;
        if (msg?.delete) await msg.delete().catch(() => {});

        // Clean up any stale queued messages
        if (player.queueMsgs?.length) {
            for (const m of player.queueMsgs) {
                if (m?.delete) await m.delete().catch(() => {});
            }
            player.queueMsgs = [];
        }

        // BUG FIX: was unconditionally calling setAutoPlay(true).
        // Now respects the config value so 24/7 mode can be toggled properly.
        if (config.autoplay) {
            player.setAutoPlay(true);
        }
    },
};