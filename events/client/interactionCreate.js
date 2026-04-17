const fs = require("fs");
const path = require("path");
const { log } = require("style-logs");

function loadCommands() {
  const commands = new Map();
  const commandsPath = path.join(__dirname, "../../commands");

  for (const file of fs
    .readdirSync(commandsPath)
    .filter((f) => f.endsWith(".js"))) {
    try {
      const fullPath = path.join(commandsPath, file);
      delete require.cache[require.resolve(fullPath)];
      const command = require(fullPath);
      if (!command.execute) {
        log(`{badge: warning}Skipping ${file}: missing execute{/}`);
        continue;
      }
      const name = file.replace(".js", "");
      commands.set(name, command);
      log(`{badge: success}Loaded: ${name}{/}`);
    } catch (err) {
      log(`{border: red}Failed loading ${file}: ${err.message}{/}`);
    }
  }

  log(`{border: blue}[CMD] ${commands.size} commands active{/}`);
  return commands;
}

let commands = loadCommands();

// ── Helpers ──────────────────────────────────────────────────────────────────
// ── Helpers ──────────────────────────────────────────────────────────────────

const reply = async (interaction, content, flags = 36864) => {
  const msg = await interaction
    .reply({
      flags,
      components: [
        {
          type: 17,
          accent_color: 16612524,
          components: [{ type: 10, content }],
        },
      ],
      fetchReply: true,
    })
    .catch(() => {});
  if (msg) setTimeout(() => msg.delete().catch(() => {}), 30_000);
};

const FILTERS = {
  none: { name: "None (Off)", emoji: "🚫" },
  bassboost: { name: "Bass Boost", emoji: "🎧" },
  nightcore: { name: "Nightcore", emoji: "⚡" },
  vaporwave: { name: "Vaporwave", emoji: "🌊" },
  "8d": { name: "8D Audio", emoji: "🎵" },
  karaoke: { name: "Karaoke", emoji: "🎤" },
  tremolo: { name: "Tremolo", emoji: "〰️" },
  vibrato: { name: "Vibrato", emoji: "🎛️" },
};

const FILTER_KEYS = Object.keys(FILTERS);

const getCurrentFilterKey = (player) =>
  player.filterIndex !== undefined ? FILTER_KEYS[player.filterIndex] : "none";

const applyFilter = async (player, key) => {
  player.filterIndex = FILTER_KEYS.indexOf(key);
  switch (key) {
    case "none":
      player.filters.setEqualizer([]);
      player.filters.setTimescale({});
      player.filters.setRotation({});
      player.filters.setKaraoke({});
      player.filters.setTremolo({});
      player.filters.setVibrato({});
      break;
    case "bassboost":
      player.filters.setEqualizer([
        { band: 0, gain: 0.4 },
        { band: 1, gain: 0.4 },
        { band: 2, gain: 0.35 },
        { band: 3, gain: 0.3 },
        { band: 4, gain: 0.25 },
        { band: 5, gain: 0.15 },
        { band: 6, gain: 0.1 },
        { band: 7, gain: 0.05 },
        { band: 8, gain: 0.0 },
        { band: 9, gain: 0.0 },
        { band: 10, gain: 0.0 },
        { band: 11, gain: 0.0 },
        { band: 12, gain: 0.0 },
      ]);
      break;
    case "nightcore":
      player.filters.setTimescale({ speed: 1.2, pitch: 1.2, rate: 1.0 });
      break;
    case "vaporwave":
      player.filters.setTimescale({ speed: 0.8, pitch: 0.8, rate: 1.0 });
      break;
    case "8d":
      player.filters.setRotation({ rotationHz: 0.2 });
      break;
    case "karaoke":
      player.filters.setKaraoke({
        level: 1.0,
        monoLevel: 1.0,
        filterBand: 220.0,
        filterWidth: 100.0,
      });
      break;
    case "tremolo":
      player.filters.setTremolo({ frequency: 4.0, depth: 0.75 });
      break;
    case "vibrato":
      player.filters.setVibrato({ frequency: 4.0, depth: 0.75 });
      break;
  }
  await player.filters.apply();
};

// lrclib fetch
const fetchLyrics = async (title, artist, duration) => {
  try {
    const durationSec = duration ? Math.floor(duration / 1000) : undefined;
    const params = new URLSearchParams({
      track_name: title,
      artist_name: artist,
    });
    if (durationSec) params.set("duration", durationSec);
    const res = await fetch(`https://lrclib.net/api/get?${params}`);
    if (!res.ok) return null;
    const data = await res.json();
    return (
      data.plainLyrics ||
      data.syncedLyrics?.replace(/\[\d+:\d+\.\d+\]/g, "").trim() ||
      null
    );
  } catch {
    return null;
  }
};

// ── Main ──────────────────────────────────────────────────────────────────────

module.exports = {
  name: "interactionCreate",
  execute: async (client, interaction) => {
    try {
      // ── Autocomplete ─────────────────────────────────────────────────────
      if (interaction.isAutocomplete()) {
        const command = commands.get(interaction.commandName);
        if (!command?.autocomplete) return;
        try {
          await command.autocomplete(client, interaction);
        } catch (error) {
          log(
            `{border: red}Autocomplete error "${interaction.commandName}": ${error.message}{/}`,
          );
        }
        return;
      }

      // ── Slash commands ───────────────────────────────────────────────────
      if (interaction.isCommand()) {
        const command = commands.get(interaction.commandName);
        if (!command) return;
        try {
          await command.execute(client, interaction);
        } catch (error) {
          log(
            `{border: red}Error executing command "${interaction.commandName}": ${error.message}{/}`,
          );
          if (!interaction.replied && !interaction.deferred) {
            await reply(
              interaction,
              "An error occurred while executing the command.",
            );
          } else if (interaction.deferred) {
            await interaction
              .editReply({
                flags: 36864,
                components: [
                  {
                    type: 17,
                    accent_color: 16612524,
                    components: [
                      {
                        type: 10,
                        content:
                          "An error occurred while executing the command.",
                      },
                    ],
                  },
                ],
              })
              .catch(() => {});
          }
        }
        return;
      }

      // ── String Select Menu ───────────────────────────────────────────────
      if (interaction.isStringSelectMenu()) {
        if (interaction.customId === "filter_select") {
          if (!client.manager) return;
          const player = client.manager.players.get(interaction.guild.id);
          if (!player)
            return reply(
              interaction,
              "There is no active player in this guild.",
            );

          const key = interaction.values[0];
          await applyFilter(player, key);
          const filter = FILTERS[key];

          const msg = await interaction
            .reply({
              flags: 36864,
              components: [
                {
                  type: 17,
                  accent_color: 16612524,
                  components: [
                    {
                      type: 10,
                      content: `${filter.emoji} Filter set to **${filter.name}**.`,
                    },
                  ],
                },
              ],
              fetchReply: true,
            })
            .catch(() => {});

          if (msg) setTimeout(() => msg.delete().catch(() => {}), 30_000);
          return;
        }
        return;
      }

      // ── Buttons ──────────────────────────────────────────────────────────
      if (interaction.isButton()) {
        if (!client.manager) {
          log(
            `{badge: warning}Received interaction but manager is uninitialized{/}`,
          );
          return;
        }

        const player = client.manager.players.get(interaction.guild.id);

        if (!player) {
          return reply(interaction, "There is no active player in this guild.");
        }

        const { customId } = interaction;

        // ── back ─────────────────────────────────────────────────────────
        if (customId === "back") {
          if (!player.queue.previous) {
            return reply(
              interaction,
              "<:prev:1449501284272181309> No previous track.",
            );
          }
          if (player.previous) {
            player.previous();
          } else {
            player.queue.unshift(player.queue.previous);
            player.stop();
          }
          return reply(
            interaction,
            "<:prev:1449501284272181309> Playing previous track.",
          );

          // ── pause / resume ───────────────────────────────────────────────
        } else if (customId === "pause") {
          if (player.paused) {
            player.pause(false);
            return reply(interaction, "<:pause:1449501265720774656> Resumed.");
          } else {
            player.pause(true);
            return reply(interaction, "<:pause:1449501265720774656> Paused.");
          }

          // ── stop ─────────────────────────────────────────────────────────
        } else if (customId === "stop") {
          player.msg.delete().catch(e => {});
          player.queue.clear();
          player.destroy();
          return reply(interaction,"<:stop:1449501286360944853> Stopped and disconnected.");

          // ── skip ─────────────────────────────────────────────────────────
        } else if (customId === "skip") {
          const title = player.current?.title || "the current track";
          player.skip();
          return reply(interaction,`<:skip:1449501258791518370> Skipped **${title}**.`,);

          // ── loop ─────────────────────────────────────────────────────────
        } else if (customId === "loop") {
          const modes = ["off", "track", "queue"];
          const currentMode = player.loop || "off";
          const nextMode =
            modes[(modes.indexOf(currentMode) + 1) % modes.length];
          player.setLoop(nextMode);
          const labels = {
            off: "<:loop_false:1449505531453767792> Loop off.",
            track: "<:loop_track:1449501271643001013> Looping current track.",
            queue: "<:loop_queue:1449501269818609876> Looping queue.",
          };
          return reply(interaction, labels[nextMode]);

          // ── shuffle ──────────────────────────────────────────────────────
        } else if (customId === "shuffle") {
          if (player.queue.size === 0)
            return reply(interaction, "Queue is empty.");
          player.queue.shuffle();
          return reply(
            interaction,
            `<:shuffle:1449501276131033219> Shuffled ${player.queue.size} tracks.`,
          );

          // ── filter → show ephemeral select menu ──────────────────────────
        } else if (customId === "filter") {
          const currentKey = getCurrentFilterKey(player);
          return interaction
            .reply({
              flags: 36864,
              components: [
                {
                  type: 17,
                  accent_color: 16612524,
                  components: [
                    {
                      type: 10,
                      content:
                        "### <:filter:1451683859845615697> Select a filter",
                    },
                    {
                      type: 1,
                      components: [
                        {
                          type: 3, // string select
                          custom_id: "filter_select",
                          placeholder: "Choose a filter...",
                          options: FILTER_KEYS.map((key) => ({
                            label: FILTERS[key].name,
                            value: key,
                            default: key === currentKey,
                            emoji: { name: FILTERS[key].emoji },
                          })),
                        },
                      ],
                    },
                  ],
                },
              ],
            })
            .catch(() => {});

          // ── lyrics ───────────────────────────────────────────────────────
        } else if (customId === "lyrics") {
          const track = player.current;
          if (!track)
            return reply(interaction, "No track is currently playing.");

          await interaction.deferReply().catch(() => {});

          const lyrics = await fetchLyrics(
            track.title,
            track.author,
            track.duration,
          );

          if (!lyrics) {
            return interaction
              .editReply({
                flags: 36864,
                components: [
                  {
                    type: 17,
                    accent_color: 16612524,
                    components: [
                      {
                        type: 10,
                        content: `<:lyrics:1482110308435628153> No lyrics found for **${track.title}**.`,
                      },
                    ],
                  },
                ],
              })
              .catch(() => {});
          }

          const MAX = 3800;
          const trimmed =
            lyrics.length > MAX ? lyrics.slice(0, MAX) + "\n..." : lyrics;

          return interaction
            .editReply({
              flags: 36864,
              components: [
                {
                  type: 17,
                  accent_color: 16612524,
                  components: [
                    {
                      type: 10,
                      content: `<:lyrics:1482110308435628153> **${track.title}** — ${track.author}\n\n${trimmed}`,
                    },
                  ],
                },
              ],
            })
            .catch(() => {});

          // ── queue ────────────────────────────────────────────────────────
        } else if (customId === "queue") {
          if (player.queue.size === 0)
            return reply(interaction, "Queue is empty.");
          const list = player.queue
            .slice(0, 15)
            .map((t, i) => `**${i + 1}.** ${t.title}`)
            .join("\n");
          return reply(
            interaction,
            `### <:queue:1451682061697159310> Queue (${player.queue.size} tracks)\n\n${list}`,
          );

          // ── autoplay ─────────────────────────────────────────────────────
        } else if (customId === "autoplay") {
          player.autoPlay = !player.autoPlay;
          return reply(
            interaction,
            `<:autoplay:1451682056927973476> Autoplay is now **${player.autoPlay ? "enabled" : "disabled"}**.`,
          );
        } else {
          log(`{badge: warning}Unhandled button customId: ${customId}{/}`);
        }
      } else {
        log(
          `{badge: warning}Unhandled interaction type: ${interaction.type}{/}`,
        );
      }
    } catch (error) {
      log(`{border: red}Uncaught interaction error: ${error.message}{/}`);
      if (!interaction.replied && !interaction.deferred) {
        await interaction
          .reply({
            flags: 36864,
            ephemeral: true,
            components: [
              {
                type: 17,
                accent_color: 16612524,
                components: [
                  { type: 10, content: "An unexpected error occurred." },
                ],
              },
            ],
          })
          .catch(() => {});
      }
    }
  },

  reload: () => {
    commands = loadCommands();
  },
};
