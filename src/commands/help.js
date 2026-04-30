const logger = require('../structures/logger');
const { hakariMessage } = require('../structures/builders');
const { EMOJIS } = require('../structures/emojis');
const {
    ContainerBuilder,
    TextDisplayBuilder,
    MediaGalleryBuilder,
    SectionBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    MessageFlags
} = require('discord.js');

// Command definitions (English only)
const commandDefinitions = {
  play: {
    description: 'Play music from a query or URL',
    usage: '.play <query or URL>',
    permission: 'Requires voice channel'
  },
  pause: {
    description: 'Pause the currently playing music',
    usage: '.pause',
    permission: 'Requires voice channel, requester only'
  },
  resume: {
    description: 'Resume paused music',
    usage: '.resume',
    permission: 'Requires voice channel, requester only'
  },
  stop: {
    description: 'Stop playback and clear the queue',
    usage: '.stop',
    permission: 'Requires voice channel, requester only'
  },
  skip: {
    description: 'Skip the current song',
    usage: '.skip',
    permission: 'Requires voice channel, requester skips directly, others vote'
  },
  queue: {
    description: 'Display the song queue',
    usage: '.queue',
    permission: 'Requires voice channel (read-only)'
  },
  loop: {
    description: 'Set loop mode (off/track/queue)',
    usage: '.loop <off/track/queue>',
    permission: 'Requires voice channel, requester only'
  },
  shuffle: {
    description: 'Shuffle the song queue',
    usage: '.shuffle',
    permission: 'Requires voice channel, requester only'
  },
  autoplay: {
    description: 'Toggle autoplay mode',
    usage: '.autoplay <on/off>',
    permission: 'Requires voice channel, requester only'
  },
  lyrics: {
    description: 'Display lyrics of the currently playing song',
    usage: '.lyrics',
    permission: 'Requires voice channel (read-only)'
  },
  bassboost: {
    description: 'Toggle bass boost audio filter',
    usage: '.bassboost',
    permission: 'Requires voice channel'
  },
  nightcore: {
    description: 'Toggle nightcore audio filter (faster & higher pitch)',
    usage: '.nightcore',
    permission: 'Requires voice channel'
  },
  vaporwave: {
    description: 'Toggle vaporwave audio filter (slower & lower pitch)',
    usage: '.vaporwave',
    permission: 'Requires voice channel'
  },
  karaoke: {
    description: 'Toggle karaoke filter (vocal removal)',
    usage: '.karaoke',
    permission: 'Requires voice channel'
  },
  tremolo: {
    description: 'Toggle tremolo filter (volume oscillation)',
    usage: '.tremolo',
    permission: 'Requires voice channel'
  },
  vibrato: {
    description: 'Toggle vibrato filter (pitch oscillation)',
    usage: '.vibrato',
    permission: 'Requires voice channel'
  },
  rotation: {
    description: 'Toggle rotation filter (8D audio effect)',
    usage: '.rotation',
    permission: 'Requires voice channel'
  },
  distortion: {
    description: 'Toggle distortion audio filter',
    usage: '.distortion',
    permission: 'Requires voice channel'
  },
  lowpass: {
    description: 'Toggle low pass filter (muffle high frequencies)',
    usage: '.lowpass',
    permission: 'Requires voice channel'
  },
  eval: {
    description: 'Execute JavaScript code (Owner only)',
    usage: '.eval <code>',
    permission: 'Bot owner only'
  },
  emit: {
    description: 'Emit Discord/MoonLink events for testing (Owner only)',
    usage: '.emit <event-name>',
    permission: 'Bot owner only'
  },
  help: {
    description: 'Show command list or details of a specific command',
    usage: '.help [command name]',
    permission: 'Available anywhere'
  },
  settings: {
    description: 'View or modify guild settings',
    usage: '.settings [set/reset] [key] [value]',
    permission: 'Available anywhere'
  },
  setup: {
    description: 'Setup announce and request channels',
    usage: '.setup [announce/request/reset]',
    permission: 'Requires Manage Channels permission'
  }
};

module.exports = {
  name: 'help',
  aliases: ['h'],
  execute: async (client, message, args) => {
    try {
      // Build commands array from client.commands (auto-loaded)
      const commands = [];
      
      client.commands.forEach((cmd, name) => {
        const cmdDef = commandDefinitions[name];
        if (cmdDef) {
          commands.push({
            name,
            aliases: cmd.aliases || [],
            description: cmdDef.description,
            usage: cmdDef.usage,
            permission: cmdDef.permission
          });
        }
      });

      // Sort commands alphabetically
      commands.sort((a, b) => a.name.localeCompare(b.name));

      // Per-command detail view
      if (args[0]) {
        const query = args[0].toLowerCase();
        const cmd = commands.find(c => c.name === query || c.aliases.includes(query));

        if (!cmd) {
          return message.reply(hakariMessage(`${EMOJIS.bot.hakari} **Hakari Music**\n\n-# Command \`${args[0]}\` not found. Use \`.help\` to see the command list.`));
        }

        const aliasLine = cmd.aliases.length > 0
          ? `\n> **Aliases:** ${cmd.aliases.map(a => `\`${a}\``).join(', ')}`
          : '';

        const helpMessage = {
          flags: MessageFlags.IsComponentsV2,
          components: [
            new ContainerBuilder()
              .setAccentColor(0xE7B88B)
              .addTextDisplayComponents(td => 
                td.setContent(`${EMOJIS.bot.hakari} **Hakari Music**\n\n## ${EMOJIS.ui.command} Command Detail: \`.${cmd.name}\``)
              )
              .addSeparatorComponents(sep => sep.setDivider(true))
              .addTextDisplayComponents(td => 
                td.setContent(`> **Description:** ${cmd.description}${aliasLine}\n> **Usage:** \`${cmd.usage}\`\n> **Permission:** ${cmd.permission}`)
              )
          ]
        };

        return message.reply(helpMessage);
      }

      // Build help message with sections matching guildCreate style
      const helpMessage = {
        flags: MessageFlags.IsComponentsV2,
        components: [
          new ContainerBuilder()
            .setAccentColor(0xE7B88B)
            .addMediaGalleryComponents(gallery =>
              gallery.addItems(item => item.setURL('https://raw.githubusercontent.com/KurniawanSatria/Hakari/refs/heads/main/assets/banner.png'))
            )
            .addTextDisplayComponents(td => 
              td.setContent("### Hakari Music - Command Guide\n-# Get everything ready in a few clicks.")
            )
            .addSeparatorComponents(sep => sep.setDivider(true))
            .addSectionComponents(section =>
              section
                .addTextDisplayComponents(td => td.setContent(`## ${EMOJIS.help_sections.playback} Playback\n-# Control music playback and queue management.`))
                .setButtonAccessory(
                  new ButtonBuilder()
                    .setCustomId('help_playback')
                    .setLabel('View Commands')
                    .setStyle(ButtonStyle.Secondary)
                )
            )
            .addSectionComponents(section =>
              section
                .addTextDisplayComponents(td => td.setContent(`## ${EMOJIS.help_sections.filters} Audio Filters\n-# Enhance your music with audio effects.`))
                .setButtonAccessory(
                  new ButtonBuilder()
                    .setCustomId('help_filters')
                    .setLabel('View Commands')
                    .setStyle(ButtonStyle.Secondary)
                )
            )
            .addSectionComponents(section =>
              section
                .addTextDisplayComponents(td => td.setContent(`## ${EMOJIS.help_sections.utility} Utility\n-# Additional helpful features.`))
                .setButtonAccessory(
                  new ButtonBuilder()
                    .setCustomId('help_utility')
                    .setLabel('View Commands')
                    .setStyle(ButtonStyle.Secondary)
                )
            )
            .addSectionComponents(section =>
              section
                .addTextDisplayComponents(td => td.setContent(`## ${EMOJIS.help_sections.owner} Owner\n-# Bot owner exclusive commands.`))
                .setButtonAccessory(
                  new ButtonBuilder()
                    .setCustomId('help_owner')
                    .setLabel('View Commands')
                    .setStyle(ButtonStyle.Secondary)
                )
            )
        ]
      };

      await message.reply(helpMessage);

    } catch (err) {
      logger.error(`Help: ${err.stack || err}`);
      message.reply(hakariMessage('### Error\nAn error occurred.'));
    }
  }
};
