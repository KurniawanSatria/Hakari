// commands/play.js
// Menggunakan Discord Components V2 (MessageFlags.IS_COMPONENTS_V2)

const {
  SlashCommandBuilder,
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  SeparatorBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDuration(ms) {
  if (!ms || isNaN(ms)) return "Unknown";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function calcWaitTime(player, queuePositionIndex) {
  let waitMs = 0;
  if (player.playing && player.current) {
    const remaining = (player.current.duration ?? 0) - (player.position ?? 0);
    if (remaining > 0) waitMs += remaining;
  }
  const queueArr = player.queue.tracks ?? player.queue;
  for (let i = 0; i < queuePositionIndex; i++) {
    waitMs += queueArr[i]?.duration ?? 0;
  }
  return waitMs;
}

async function saveQueueMsg(message, player) {
  try {
    const sent = await message.fetchReply ? await message.fetchReply() : message;
    if (!player.queueMsgs) player.queueMsgs = [];
    player.queueMsgs.push(sent);
  } catch (err) {
    console.error("[PLAY CMD] saveQueueMsg error:", err.message);
  }
}

const FALLBACK_TRACK_IMG = "https://files.catbox.moe/fnlch5.jpg";

// ─── Component V2 Builders ───────────────────────────────────────────────────

/**
 * Membangun pesan Components V2 untuk single track.
 */
function buildTrackComponents(track, positionLabel, waitFormatted, totalInQueue) {
  const thumbnail = new ThumbnailBuilder()
    .setURL(track.thumbnail || FALLBACK_TRACK_IMG);

  const section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### Added to Queue\n**[${track.title} — ${track.author}](${track.uri})**`
      ),
      new TextDisplayBuilder().setContent(
        `<:duration:1482113128077463682> Duration: \`${formatDuration(track.duration)}\``
      )
    )
    .setThumbnailAccessory(thumbnail);

  const separator = new SeparatorBuilder()
    .setSpacing(SeparatorSpacingSize.Small)
    .setDivider(false);

  const meta = new TextDisplayBuilder().setContent(
    `-# <:position:1465814305764278589> Position: \`${positionLabel}\` • <:playysin:1449501267847151707> Plays in: \`${waitFormatted}\` • <:queue:1451682061697159310> Queue: \`${totalInQueue} tracks\``
  );

  const container = new ContainerBuilder()
    .addSectionComponents(section)
    .addSeparatorComponents(separator)
    .addTextDisplayComponents(meta);

  return {
    flags: MessageFlags.IsComponentsV2,
    components: [container],
  };
}

/**
 * Membangun pesan Components V2 untuk playlist.
 */
function buildPlaylistComponents(playlistName, tracks, startPosition, waitFormatted, totalInQueue) {
  const playlistDurationMs = tracks.reduce((acc, t) => acc + (t.duration ?? 0), 0);
  const thumbnail = new ThumbnailBuilder()
    .setURL(tracks[0]?.thumbnail || FALLBACK_TRACK_IMG);

  const section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### <:musicalnote:1482113385486352586> Playlist Loaded!`
      ),
      new TextDisplayBuilder().setContent(
        `**${playlistName}**`
      ),
      new TextDisplayBuilder().setContent(
        `\`${tracks.length}\` tracks • <:duration:1482113128077463682> Duration: \`${formatDuration(playlistDurationMs)}\``
      )
    )
    .setThumbnailAccessory(thumbnail);

  const separator = new SeparatorBuilder()
    .setSpacing(SeparatorSpacingSize.Small)
    .setDivider(false);

  const meta = new TextDisplayBuilder().setContent(
    `-# <:position:1465814305764278589> Position: \`#${startPosition + 1} – #${startPosition + tracks.length}\` • <:playysin:1449501267847151707> Plays in: \`${waitFormatted}\` • <:queue:1451682061697159310> Queue: \`${totalInQueue} tracks\``
  );

  const container = new ContainerBuilder()
    .addSectionComponents(section)
    .addSeparatorComponents(separator)
    .addTextDisplayComponents(meta);

  return {
    flags: MessageFlags.IsComponentsV2,
    components: [container],
  };
}

// ─── Command ─────────────────────────────────────────────────────────────────

module.exports = {
  name: "play",
  aliases: ["p"],

  execute: async (client, message, args) => {
    try {
      const query = args.join(" ");

      if (!query)
        return message.reply({ content: "Please provide a song name or URL." });

      if (!message.member.voice.channel)
        return message.reply({ content: "You must be in a voice channel." });

      if (!client.manager)
        return message.reply({ content: "Music manager is not initialized yet. Try again in a moment." });

      // Buat player (sync)
      const player = client.manager.players.create({
        guildId: message.guild.id,
        voiceChannelId: message.member.voice.channel.id,
        textChannelId: message.channel.id,
        deaf: true,
        autoPlay: true,
      });

      // Connect + search secara paralel
      const [, searchResult] = await Promise.all([
        player.connect(),
        client.manager.search({ query, requester: message.author }),
      ]);

      const { loadType, tracks, playlistInfo } = searchResult;

      // ─── PLAYLIST ────────────────────────────────────────────────────────
      if (loadType === "playlist") {
        const queueArr = player.queue.tracks ?? player.queue;
        const startPosition = queueArr.length;

        for (const track of tracks) {
          track.setRequester?.(message.author) ?? (track.requester = message.author);
          player.queue.add(track);
        }

        const totalInQueue = (player.queue.tracks ?? player.queue).length;
        const isPlayingNow = !player.playing && !player.paused;
        const waitMs = calcWaitTime(player, startPosition);
        const waitFormatted = isPlayingNow ? "Now" : formatDuration(waitMs);
        const playlistName =
          playlistInfo?.name || tracks[0]?.playlist?.name || "Unknown Playlist";

        await message.reply(
          buildPlaylistComponents(playlistName, tracks, startPosition, waitFormatted, totalInQueue)
        );

        await saveQueueMsg(message, player);

      // ─── SINGLE TRACK / SEARCH ───────────────────────────────────────────
      } else if (loadType === "search" || loadType === "track") {
        const track = tracks[0];
        track.setRequester?.(message.author) ?? (track.requester = message.author);

        const queueArr = player.queue.tracks ?? player.queue;
        const positionIndex = queueArr.length;

        player.queue.add(track);

        const totalInQueue = (player.queue.tracks ?? player.queue).length;
        const isPlayingNow = !player.playing && !player.paused;
        const waitMs = calcWaitTime(player, positionIndex);
        const waitFormatted = isPlayingNow ? "Now" : `~${formatDuration(waitMs)}`;
        const positionLabel = isPlayingNow ? "Up next" : `#${positionIndex + 1}`;

        await message.reply(
          buildTrackComponents(track, positionLabel, waitFormatted, totalInQueue)
        );

        await saveQueueMsg(message, player);

      // ─── NO RESULTS ──────────────────────────────────────────────────────
      } else {
        return message.reply({ content: "There are no results found." });
      }

      if (!player.playing && !player.paused) player.play();

    } catch (error) {
      console.error("[PLAY CMD] Error:", error);
      await message.reply({ content: "An error occurred while trying to play that track." });
    }
  },
};