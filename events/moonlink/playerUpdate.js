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
    execute: async (client, player, payload) => {
        // BUG FIX: player.queue.current does not exist — use player.current
        const track = player.current;

        if (!player.msg || !track || !track.duration) return;
        if (!player.currentComponents) return;

        const position = payload?.state?.position ?? 0;
        const remaining = msToTime(Math.max(0, track.duration - position));

        try {
            // Deep-clone to avoid mutating the stored template
            const comps = JSON.parse(JSON.stringify(player.currentComponents));

            const container = comps[0];
            if (!container || container.type !== 17 || !Array.isArray(container.components)) return;

            // Row layout (see trackStart.js buildComponents):
            // [0] section (thumbnail + title/author)
            // [1] separator
            // [2] info text  ← update remaining time here
            // [3] action row (back/pause/stop/skip/loop)
            // [4] action row (queue/shuffle/filter/lyrics/autoplay)

            const infoComp = container.components[2];
            if (infoComp?.type === 10) {
                infoComp.content = `-# <:duration:1482113128077463682> ${remaining} • <:volume:1482112735910166609> 100% • <:requester:1465814308394107180> ${track.requester}`;
            }

            // Update loop button emoji (row [3], button index 4)
            const actionRow = container.components[3];
            const loopBtn = actionRow?.components?.[4];
            if (loopBtn?.custom_id === "loop") {
                const emoji = LOOP_EMOJI[player.loop] ?? LOOP_EMOJI.off;
                loopBtn.emoji = { id: emoji.id, name: emoji.name };
            }

            await player.msg.edit({ flags: 36864, accent_color: 16612524, components: comps });
            player.currentComponents = comps;
        } catch (err) {
            // Suppress Unknown Message errors (message already deleted)
            if (err.code !== 10008) {
                console.error("[PLAYER UPDATE] Failed:", err.message);
            }
        }
    },
};