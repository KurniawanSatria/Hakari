const logger = require('../structures/logger');
const langManager = require('../structures/langManager');
const { PermissionFlagsBits } = require('discord.js');
const { hakariMessage } = require('../structures/builders');

module.exports = {
  name: 'lang',
  aliases: ['language'],
  execute: async (client, message, args) => {
    try {
      const t = langManager.get(message.guild.id);
      const available = langManager.getAvailableLanguages();
      const listStr = available.map(c => `\`${c}\` (${langManager.getLangName(c)})`).join(', ');

      // No args: show current language
      if (!args[0]) {
        const tLang = t.lang;
        return message.reply(hakariMessage(`${tLang.current.replace('{lang}', langManager.getLangName(getGuildLangCode(message.guild.id)))}\n\n-# ${tLang.available.replace('{list}', listStr)}`));
      }

      const langCode = args[0].toLowerCase();

      // Check permission
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return message.reply(hakariMessage(t.lang.noPermission));
      }

      // Invalid language
      if (!langManager.set(message.guild.id, langCode)) {
        return message.reply(hakariMessage(t.lang.invalid.replace('{list}', listStr)));
      }

      // Success - get new language strings
      const newT = langManager.get(message.guild.id);
      return message.reply(hakariMessage(newT.lang.changed.replace('{lang}', langManager.getLangName(langCode))));

    } catch (err) {
      logger.error(`Lang: ${err.stack || err}`);
    }
  }
};

function getGuildLangCode(guildId) {
  // Read the guild settings to find the actual code
  const fs = require('fs');
  const path = require('path');
  const settingsPath = path.join(__dirname, '../../data/guildLang.json');
  try {
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      return settings[guildId] || 'id';
    }
  } catch (e) { /* ignore */ }
  return 'id';
}
