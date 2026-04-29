const logger = require('../structures/logger');
const { hakariMessage, hakariHelpCard, HAKARI_EMOJI } = require('../structures/builders');

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
          return message.reply(hakariMessage(`${HAKARI_EMOJI} **Hakari Music**\n\n-# Command \`${args[0]}\` not found. Use \`.help\` to see the command list.`));
        }

        const aliasLine = cmd.aliases.length > 0
          ? `\n> **Aliases:** ${cmd.aliases.map(a => `\`${a}\``).join(', ')}`
          : '';

        return message.reply(hakariHelpCard({
          headerContent: `${HAKARI_EMOJI} **Hakari Music**\n\n`,
          bodyContent: `## <:icons8command100:1497903456067780698> Command Detail: \`.${cmd.name}\`\n> **Description:** ${cmd.description}${aliasLine}\n> **Usage:** \`${cmd.usage}\`\n> **Permission:** ${cmd.permission}`,
          thumbnailURL: 'https://i.pinimg.com/736x/0b/10/35/0b103568ea4ff4be76d73c44102e697e.jpg',
        }));
      }

      // Full command list view
      const commandList = commands.map(cmd => {
        const aliasText = cmd.aliases.length > 0 ? ` *(${cmd.aliases.join(', ')})*` : '';
        return `- \`${cmd.usage}\`${aliasText}\n  - ${cmd.description}`;
      }).join('\n\n');

      await message.reply(hakariHelpCard({
        headerContent: `${HAKARI_EMOJI} **Hakari Music**\n\n`,
        bodyContent: `## <:icons8command100:1497903456067780698> Command List\n-# Here are all available commands for the Hakari music bot:\n${commandList}\n\n-# Use \`.help [command name]\` for more details`,
        thumbnailURL: 'https://i.pinimg.com/736x/0b/10/35/0b103568ea4ff4be76d73c44102e697e.jpg',
        galleryURLs: ['https://i.ibb.co.com/F4kMkZj4/hakari-1.gif'],
      }));

    } catch (err) {
      logger.error(`Help: ${err.stack || err}`);
      message.reply(hakariMessage('### Error\nAn error occurred.'));
    }
  }
};
