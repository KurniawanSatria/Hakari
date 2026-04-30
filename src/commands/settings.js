const guildDB = require('../structures/guildDB');
const { hakariCard, hakariMessage } = require('../structures/builders');
const { EMOJIS } = require('../structures/emojis');

module.exports = {
  name: 'settings',
  aliases: ['config', 'setting', 'cfg'],
  execute: async (client, message, args) => {
    try {
      const action = args[0]?.toLowerCase();
      const key = args[1]?.toLowerCase();
      const value = args.slice(2).join(' ');

      if (!action || action === 'view') {
        const settings = guildDB.getGuild(message.guild.id);
        
        const settingsList = [
          `**Prefix:** \`${settings.prefix}\``,
          `**Language:** \`${settings.language}\``,
          `**Autoplay:** \`${settings.autoplay ? 'ON' : 'OFF'}\``,
          `**Volume:** \`${settings.volume}%\``,
          `**Clean Timeout:** \`${settings.cleanTimeout / 1000}s\``,
          `**24/7 Mode:** \`${settings.twentyFourSeven ? 'ON' : 'OFF'}\``,
          `**Search Engine:** \`${settings.defaultSearch}\``,
          `**Max Queue:** \`${settings.maxQueueSize}\``,
          `**Vote Skip:** \`${settings.voteSkip ? 'ON' : 'OFF'}\``,
          `**Vote Ratio:** \`${settings.voteSkipRatio * 100}%\``,
          `**Now Playing:** \`${settings.nowPlayingEnabled ? 'ON' : 'OFF'}\``,
          `**Lyrics:** \`${settings.lyricsEnabled ? 'ON' : 'OFF'}\``,
          `**Announce:** ${settings.announceChannelId ? `<#${settings.announceChannelId}>` : '\`Not set\`'}`,
          `**Request:** ${settings.requestChannelId ? `<#${settings.requestChannelId}>` : '\`Not set\`'}`,
        ].join('\n');

        return message.reply(hakariCard({
          content: `### ${EMOJIS.ui.settings} Guild Settings\n\n${settingsList}\n\n-# Use \`.settings set <key> <value>\` to change\n-# Use \`.setup\` to configure channels`,
          thumbnailURL: message.guild.iconURL() || 'https://files.catbox.moe/fnlch5.jpg'
        }));
      }

      if (action === 'set') {
        if (!key) {
          return message.reply(hakariMessage('### Usage\n\n`.settings set <key> <value>`\n\nKeys: prefix, language, autoplay, volume, cleantimeout, 247, search, maxqueue, voteskip, voteratio, nowplaying, lyrics'));
        }

        const validKeys = ['prefix', 'language', 'autoplay', 'volume', 'cleantimeout', '247', 'search', 'maxqueue', 'voteskip', 'voteratio', 'nowplaying', 'lyrics'];
        if (!validKeys.includes(key)) {
          return message.reply(hakariMessage(`### Invalid Key\n\nValid keys: ${validKeys.join(', ')}`));
        }

        let parsedValue;
        switch (key) {
          case 'prefix':
            parsedValue = value || '.';
            break;
          case 'language':
            parsedValue = ['en', 'id'].includes(value) ? value : 'en';
            break;
          case 'autoplay':
          case 'voteskip':
          case 'nowplaying':
          case 'lyrics':
            parsedValue = ['on', 'true', '1'].includes(value?.toLowerCase());
            break;
          case 'volume':
            parsedValue = Math.min(100, Math.max(1, parseInt(value) || 100));
            break;
          case 'cleantimeout':
            parsedValue = parseInt(value) * 1000 || 60000;
            break;
          case '247':
            parsedValue = ['on', 'true', '1'].includes(value?.toLowerCase());
            break;
          case 'search':
            parsedValue = ['spsearch', 'ytsearch', 'ytmsearch', 'scsearch'].includes(value) ? value : 'spsearch';
            break;
          case 'maxqueue':
            parsedValue = Math.min(5000, Math.max(10, parseInt(value) || 1000));
            break;
          case 'voteratio':
            parsedValue = Math.min(1, Math.max(0.1, parseFloat(value) || 0.5));
            break;
        }

        guildDB.setGuildSetting(message.guild.id, key === '247' ? 'twentyFourSeven' : key === 'search' ? 'defaultSearch' : key === 'maxqueue' ? 'maxQueueSize' : key === 'voteratio' ? 'voteSkipRatio' : key === 'nowplaying' ? 'nowPlayingEnabled' : key, parsedValue);

        return message.reply(hakariCard({
          content: `### ${EMOJIS.ui.success} Setting Updated\n\n**${key}** set to \`${parsedValue}\``,
          thumbnailURL: message.guild.iconURL() || 'https://files.catbox.moe/fnlch5.jpg'
        }));
      }

      if (action === 'reset') {
        guildDB.resetGuild(message.guild.id);
        return message.reply(hakariMessage('### Settings Reset\n\nAll settings have been reset to default.'));
      }

      return message.reply(hakariMessage('### Usage\n\n`.settings` - View settings\n`.settings set <key> <value>` - Change setting\n`.settings reset` - Reset to default'));

    } catch (err) {
      message.reply(hakariMessage('### Error\nFailed to manage settings.'));
    }
  }
};
