module.exports = {
name: "trackEnd",
execute: async (client, player, track) => {
const channel = client.channels.cache.get(player.textChannelId);
if (!channel) return;
const msg = player?.msg;
player.msg = null;
if (msg && typeof msg.delete === "function") {
await msg.delete().catch(() => {});
}
},
};
