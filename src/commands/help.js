const logger = require('../structures/logger');
const langManager = require('../structures/langManager');
const { hakariMessage, hakariHelpCard, HAKARI_EMOJI } = require('../structures/builders');

module.exports = {
  name: 'help',
  aliases: ['h'],
  execute: async (client, message, args) => {
    try {
      const t = langManager.get(message.guild.id);
      const cmdDefs = t.help.commands;

      // Build commands array from language file
      const commandAliases = {
        play: ['p'],
        pause: [],
        resume: [],
        stop: [],
        skip: ['s'],
        queue: ['q'],
        loop: ['l'],
        shuffle: [],
        autoplay: [],
        lyrics: ['ly'],
        help: ['h'],
        lang: ['language']
      };

      const commands = Object.entries(cmdDefs).map(([name, cmd]) => ({
        name,
        aliases: commandAliases[name] || [],
        description: cmd.description,
        usage: cmd.usage,
        permission: cmd.permission
      }));

      // Per-command detail view
      if (args[0]) {
        const query = args[0].toLowerCase();
        const cmd = commands.find(c => c.name === query || c.aliases.includes(query));

        if (!cmd) {
          return message.reply(hakariMessage(`${HAKARI_EMOJI} **Hakari Music**\n\n-# ${t.help.commandNotFound.replace('{cmd}', args[0])}`));
        }

        const aliasLine = cmd.aliases.length > 0
          ? `\n> **${t.help.detailAliases}:** ${cmd.aliases.map(a => `\`${a}\``).join(', ')}`
          : '';

        return message.reply(hakariHelpCard({
          headerContent: `${HAKARI_EMOJI} **Hakari Music**\n\n`,
          bodyContent: `## <:icons8command100:1497903456067780698> ${t.help.detailTitle}: \`.${cmd.name}\`\n> **${t.help.detailDescription}:** ${cmd.description}${aliasLine}\n> **${t.help.detailUsage}:** \`${cmd.usage}\`\n> **${t.help.detailPermission}:** ${cmd.permission}`,
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
        bodyContent: `## <:icons8command100:1497903456067780698> ${t.help.title}\n-# ${t.help.subtitle}\n${commandList}\n\n-# ${t.help.footer}`,
        thumbnailURL: 'https://i.pinimg.com/736x/0b/10/35/0b103568ea4ff4be76d73c44102e697e.jpg',
        galleryURLs: ['https://i.ibb.co.com/F4kMkZj4/hakari-1.gif'],
      }));

    } catch (err) {
      logger.error(`Help: ${err.stack || err}`);
      message.reply(hakariMessage('### Error\nAn error occurred.'));
    }
  }
};
