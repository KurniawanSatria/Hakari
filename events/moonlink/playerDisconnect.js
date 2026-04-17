module.exports = {
    name: "playerDisconnected",
    execute: async (client, player) => {
        const channel = client.channels.cache.get(player.textChannelId);
        if (!channel) return;

        const msg = player?.msg;
        player.msg = null;

        if (msg && typeof msg.delete === "function") {
            await msg.delete().catch(() => {});
        }
    },
};