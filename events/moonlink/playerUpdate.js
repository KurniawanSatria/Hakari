const msToTime = ms => {
  if (!ms || ms < 0) return "0:00"
  const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`
}

const validateComponents = (comps) => {
  if (!comps || !Array.isArray(comps) || comps.length === 0) return false
  const container = comps[0]
  if (container?.type !== 17 || !Array.isArray(container.components)) return false
  const row2 = container.components[2]
  const row3 = container.components[3]
  return row2 && row3?.components && row3.components.length > 4
}

const LOOP_EMOJI = {
  off:   { id: "1449505531453767792", name: "loop_false" },
  track: { id: "1449501271643001013", name: "loop_track" },
  queue: { id: "1449501269818609876", name: "loop_queue" },
}

module.exports = {
  name: "playerUpdate",
  execute: async (client, player, payload) => {
    const track = player.queue?.current
    
    console.log("[DEBUG]", {
      guild: player.guild,
      title: track?.title,
      duration: track?.duration,
      position: payload?.state?.position
    })

    if (!player.msg || !track || !track.duration) return
    if (!player.currentComponents) return

    const position = payload?.state?.position ?? 0
    const remaining = msToTime(track.duration - position)

    try {
      const comps = JSON.parse(JSON.stringify(player.currentComponents))

      // index [2] = info text (duration • volume • requester) inside container
      const infoComp = comps[0].components[2]
      if (infoComp?.type === 10) {
        infoComp.content = `-# <:duration:1482113128077463682> ${remaining} • <:volume:1482112735910166609> 100% • <:requester:1465814308394107180> ${track.requester}`
      }

      // update loop button emoji (container row [3], button index 4)
      const loopBtn = comps[0].components[3].components[4]
      if (loopBtn?.custom_id === "loop") {
        const emoji = LOOP_EMOJI[player.loop] || LOOP_EMOJI.off
        loopBtn.emoji = { id: emoji.id, name: emoji.name }
      }

      await player.msg.edit({ flags: 36864, accent_color: 16612524, components: comps })
      player.currentComponents = comps
    } catch (err) {
      console.error("[PLAYER UPDATE] Failed:", err.message)
    }
  }
}