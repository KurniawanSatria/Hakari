// src/events/client/messageCreate.js - Message command handler

const path = require('path');
const config = require('../../structures/config');
const logger = require('../../structures/logger');

let aliases = null;

function loadCommands() {
  const commandsMap = new Map();
  const aliasesMap = new Map();
  const commandsPath = path.join(__dirname, '../../commands');
  
  try {
    for (const file of require('fs').readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
      const fullPath = path.join(commandsPath, file);
      delete require.cache[require.resolve(fullPath)];
      const cmd = require(fullPath);
      if (cmd.execute) {
        const name = file.replace('.js', '');
        commandsMap.set(name, cmd);
        if (cmd.aliases) {
          for (const alias of cmd.aliases) {
            aliasesMap.set(alias, name);
          }
        }
      }
    }
  } catch (err) {
    logger.error(`Failed to load commands: ${err.message}`);
  }
  
  return { commands: commandsMap, aliases: aliasesMap };
}

module.exports = {
  name: 'messageCreate',
  execute: async (client, message) => {
    // Ignore bots
    if (message.author.bot) return;
    message.suppressEmbeds().catch(() => {});
    
    // Check prefix
    if (!message.content.startsWith(config.prefix)) return;
    
    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    // Load/reload commands (global for hot-reload support)
    if (!global.__hakariCommands) {
      const loaded = loadCommands();
      global.__hakariCommands = loaded.commands;
      aliases = loaded.aliases;
    }
    
    const commands = global.__hakariCommands;
    
    let command = commands.get(commandName);
    if (!command) {
      const target = aliases.get(commandName);
      if (target) command = commands.get(target);
    }
    if (!command) return;
    
    try {
      await command.execute(client, message, args);
    } catch (err) {
      const { wrap, e } = require('../../structures/components');
      message.channel.send(wrap({
        type: 10,
        content: `### ${e('error')} Error\n\nAn error occurred while executing the command.`
      })).catch(() => {});
    }
  }
};