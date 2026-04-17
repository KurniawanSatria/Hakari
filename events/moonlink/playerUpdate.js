// events/moonlink/playerUpdate.js

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

const LOOP_EMOJI = {
    off:   { id: "1449505531453767792", name: "loop_false" },
    track: { id: "1449501271643001013", name: "loop_track" },
    queue: { id: "1449501269818609876", name: "loop_queue" },
};

module.exports = {
    name: "playerUpdate",

    // moonlink.js v5 emits: ("playerUpdate", player, track, payload)
    // moonlink.js registers handlers as: (...args) => handler.execute(client, ...args)
    // So our function receives:          (client, player, track, payload)
    //
    // The old signature was (client, player, payload) — "track" was missing,
    // causing player/track/payload to all be shifted one argument off, which is
    // why every property logged as undefined.
    execute: async (client, player, track, payload) => {
        // Guard: need a live message and a track with a known duration
        if (!player?.msg || !track?.duration) return;
        if (!player.currentComponents) return;

        // moonlink updates track.position before emitting, but payload.state.position
        // is the authoritative live value from Lavalink
        const position = payload?.state?.position ?? track.position ?? 0;
        const remaining = msToTime(Math.max(0, track.duration - position));

        try {
            // Deep-clone so we never mutate the stored template
            const comps = JSON.parse(JSON.stringify(player.currentComponents));

            const container = comps[0];
            if (!container || container.type !== 17 || !Array.isArray(container.components)) return;

            // Component layout built in trackStart.js buildComponents():
            //   [0] section  (thumbnail + title/author)
            //   [1] separator
            //   [2] info text  ← remaining time lives here
            //   [3] action row (back / pause / stop / skip / loop)
            //   [4] action row (queue / shuffle / filter / lyrics / autoplay)

            const infoComp = container.components[2];
            if (infoComp?.type === 10) {
                infoComp.content =
                    `-# <:duration:1482113128077463682> ${remaining} • <:volume:1482112735910166609> 100% • <:requester:1465814308394107180> ${track.requester}`;
            }

            // Sync loop-button emoji with the current loop mode
            const loopBtn = container.components[3]?.components?.[4];
            if (loopBtn?.custom_id === "loop") {
                const emoji = LOOP_EMOJI[player.loop] ?? LOOP_EMOJI.off;
                loopBtn.emoji = { id: emoji.id, name: emoji.name };
            }

            await player.msg.edit({ flags: 36864, accent_color: 16612524, components: comps });
            player.currentComponents = comps;
        } catch (err) {
            // 10008 = Unknown Message (already deleted) — not worth logging
            if (err.code !== 10008) {
                console.error("[PLAYER UPDATE] Failed:", err.message);
            }
        }
    },
};