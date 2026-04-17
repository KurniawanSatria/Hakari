// events/moonlink/trackStart.js

const { REST } = require("discord.js");
const config = require("../../config");

const rest = new REST({ version: "10" }).setToken(config.token);

// BUG FIX: voice status must be set on the VOICE channel, not the text channel
async function setVoiceStatus(voiceChannelId, status) {
    try {
        await rest.put(`/channels/${voiceChannelId}/voice-status`, { body: { status } });
    } catch (err) {
        // Non-fatal – missing permissions or unsupported channel type
        console.warn("[TRACK START] Failed to set voice status:", err.message);
    }
}

const SOURCE_EMOJI = {
    youtube:      "<:yt:1481718394075222248>",
    youtubemusic: "<:youtubemusic:1477741892715286640>",
    spotify:      "<:spy:1481718391847915631>",
    soundcloud:   "<:sc:1481718389226602506>",
    deezer:       "<:deezer:1477741970326683841>",
};

const getSourceKey = uri => {
    if (!uri) return null;
    if (uri.includes("spotify.com"))    return "spotify";
    if (uri.includes("soundcloud.com")) return "soundcloud";
    if (uri.includes("deezer.com"))     return "deezer";
    if (uri.includes("music.youtube"))  return "youtubemusic";
    if (uri.includes("youtube.com") || uri.includes("youtu.be")) return "youtube";
    return null;
};

const msToTime = ms => {
    if (!ms || ms < 0) return "0:00";
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
        ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
        : `${m}:${String(sec).padStart(2, "0")}`;
};

const truncate = (str, max) => str.length > max ? str.slice(0, max) + "…" : str;

const buildComponents = (track, player) => {
    const thumbnail = track.thumbnail || "";
    const queueEmpty = player.queue.size === 0;

    return [{
        type: 17,
        components: [
            {
                type: 9,
                components: [{
                    type: 10,
                    content: `<:image:1482121759330275400> Hakari Music\n\n**${truncate(track.title, 27)}**\n**${truncate(track.author, 27)}**`,
                }],
                accessory: { type: 11, media: { url: thumbnail } },
            },
            { type: 14 },
            {
                type: 10,
                content: `-# <:duration:1482113128077463682> ${msToTime(track.duration)} • <:volume:1482112735910166609> 100% • <:requester:1465814308394107180> ${track.requester}`,
            },
            {
                type: 1,
                components: [
                    { style: 2, type: 2, custom_id: "back",  emoji: { id: "1449501284272181309", name: "prev" } },
                    { style: 2, type: 2, custom_id: "pause", emoji: { id: "1449501265720774656", name: "pause" } },
                    { style: 2, type: 2, custom_id: "stop",  emoji: { id: "1449501286360944853", name: "stop" } },
                    { style: 2, type: 2, custom_id: "skip",  emoji: { id: "1449501258791518370", name: "skip" } },
                    { style: 2, type: 2, custom_id: "loop",  emoji: { id: "1449505531453767792", name: "loop_false" } },
                ],
            },
            {
                type: 1,
                components: [
                    { style: 2, type: 2, custom_id: "queue",    emoji: { id: "1451682061697159310", name: "queue" },    disabled: queueEmpty },
                    { style: 2, type: 2, custom_id: "shuffle",  emoji: { id: "1449501276131033219", name: "shuffle" },  disabled: queueEmpty },
                    { style: 2, type: 2, custom_id: "filter",   emoji: { id: "1451683859845615697", name: "filter" } },
                    { style: 2, type: 2, custom_id: "lyrics",   emoji: { id: "1482110308435628153", name: "lyrics" },   disabled: track.sourceName !== "spotify" },
                    { style: 2, type: 2, custom_id: "autoplay", emoji: { id: "1451682056927973476", name: "autoplay" }, disabled: true },
                ],
            },
        ],
    }];
};

module.exports = {
    name: "trackStart",
    execute: async (client, player, track) => {
        const channel = client.channels.cache.get(player.textChannelId);
        if (!channel) return;

        const sourceKey = getSourceKey(track.uri);
        const statusPrefix = sourceKey && SOURCE_EMOJI[sourceKey] ? `${SOURCE_EMOJI[sourceKey]} ` : "";

        // BUG FIX: set status on voiceChannelId, not textChannelId
        await setVoiceStatus(player.voiceChannelId, `${statusPrefix}${track.title}`);

        // Clean up previous now-playing message
        if (player.msg?.delete) await player.msg.delete().catch(() => {});
        player.msg = null;

        const pending = player.queueMsgs?.length ? player.queueMsgs.pop() : null;
        const components = buildComponents(track, player);
        const payload = { flags: 36864, accent_color: 16612524, components };

        player.currentComponents = components;

        const msg = pending?.edit
            ? await pending.edit(payload).catch(() => channel.send(payload).catch(() => {}))
            : await channel.send(payload).catch(() => {});

        if (msg) {
            msg.cleanIgnore = true;
            player.msg = msg;
        }
    },
};