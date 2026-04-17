const { REST } = require("discord.js")
const config = require("../../config");
const rest = new REST({ version: '10' }).setToken(config.token)

async function setVoiceStatus(channelId, status) {
    return await rest.put(
        `/channels/${channelId}/voice-status`,
        { body: { status } }
    )
}

const SOURCE_EMOJI = {
  youtube: "<:yt:1481718394075222248>",
  youtubemusic: "<:youtubemusic:1477741892715286640>",
  spotify: "<:spy:1481718391847915631>",
  soundcloud: "<:sc:1481718389226602506>",
  deezer: "<:deezer:1477741970326683841>"
}

const getSourceKey = u => {
  if (u?.includes("spotify.com")) return "spotify"
  if (u?.includes("soundcloud.com")) return "soundcloud"
  if (u?.includes("deezer.com")) return "deezer"
  if (u?.includes("music.youtube")) return "youtubemusic"
  if (u?.includes("youtube.com") || u?.includes("youtu.be")) return "youtube"
}

const msToTime = ms => {
  if (!ms || ms < 0) return "0:00"
  const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`
}

const buildComponents = (track, player) => {
  const thumbnail = track.thumbnail || ""

  return [{
    type: 17,
    components: [
      {
        type: 9,
        components: [{ type: 10, content: `<:image:1482121759330275400> Hakari Music\n\n**${track.title.length > 27 ? track.title.slice(0,27) : track.title}**\n**${track.author.length > 27 ? track.author.slice(0,27) : track.author}**` }],
        accessory: { type: 11, media: { url: thumbnail } }
      },
      { type: 14 },
      { type: 10, content:`-# <:duration:1482113128077463682> ${msToTime(track.duration)} • <:volume:1482112735910166609> 100% • <:requester:1465814308394107180> ${track.requester}` },
      {
        type: 1, components: [
          { style: 2, type: 2, custom_id: "back", emoji: { id:"1449501284272181309", name: "prev" },  },
          { style: 2, type: 2, custom_id: "pause", emoji: { id: "1449501265720774656",  name: "pause"}, },
          { style: 2, type: 2, custom_id: "stop", emoji: { id: "1449501286360944853",  name: "stop"},  },
          { style: 2, type: 2, custom_id: "skip", emoji: { id: "1449501258791518370", name: "skip" },  },
          { style: 2, type: 2, custom_id: "loop", emoji: { id: "1449505531453767792", name: "loop_false" }, },
        ]
      },
      {
        type: 1, components: [
          { style: 2, type: 2, custom_id: "queue", emoji: { id: "1451682061697159310", name: "queue" }, disabled: player.queue.size === 0 },
          { style: 2, type: 2, custom_id: "shuffle", emoji: { id: "1449501276131033219", name: "shuffle" }, disabled: player.queue.size === 0 },
          { style: 2, type: 2, custom_id: "filter", emoji: { id: "1451683859845615697",  name: "filter"},  },
          { style: 2, type: 2, custom_id: "lyrics", emoji: { id: "1482110308435628153", name: "lyrics" },  disabled: track.sourceName !== "spotify" },
          { style: 2, type: 2, custom_id: "autoplay", emoji: { id: "1451682056927973476", name: "autoplay" },  disabled: true },
        ]
      }
    ]
  }]
}

module.exports = {
  name: "trackStart",
  execute: async (client, player, track) => {
    const channel = client.channels.cache.get(player.textChannelId)
    if (!channel) return
    const sourceKey = getSourceKey(track.uri) || "unknown"
    await setVoiceStatus(player.textChannelId, `${SOURCE_EMOJI[sourceKey] ? `${SOURCE_EMOJI[sourceKey]} ` : ""} ${track.title}`)
    if (player?.msg?.delete) await player.msg.delete().catch(() => {})
    player.msg = null

    const pending = player.queueMsgs?.length ? player.queueMsgs.pop() : null
    const components = buildComponents(track, player)

    const payload = { flags: 36864, accent_color: 16612524, components }

    player.currentComponents = components

    const msg = pending?.edit
      ? await pending.edit(payload).catch(() => channel.send(payload).catch(() => {}))
      : await channel.send(payload).catch(() => {})

    if (msg) {
      msg.cleanIgnore = true
      player.msg = msg
    }
  }
}