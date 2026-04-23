// src/commands/reload.js - Hot reload all modules

const fs = require('fs');
const path = require('path');
const { successMsg, errorMsg, e } = require('../structures/components');
const logger = require('../structures/logger');

let lastReload = 0;
const RELOAD_INTERVAL = 2000;

// Global commands reference for reset
global.__hakariCommands = null;

function reloadAll() {
  const now = Date.now();
  if (now - lastReload < RELOAD_INTERVAL) {
    return { success: false, reason: ' cooldown' };
  }
  lastReload = now;
  
  let reloaded = { commands: 0, events: 0, structures: 0 };
  
  const structuresPath = path.join(__dirname, '../structures');
  const eventsPath = path.join(__dirname, '../events');
  const commandsPath = path.join(__dirname, '../commands');
  
  try {
    // Reload structures
    for (const file of fs.readdirSync(structuresPath).filter(f => f.endsWith('.js'))) {
      const fullPath = path.join(structuresPath, file);
      delete require.cache[require.resolve(fullPath)];
      reloaded.structures++;
    }
    
    // Reload commands
    for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
      const fullPath = path.join(commandsPath, file);
      delete require.cache[require.resolve(fullPath)];
      reloaded.commands++;
    }
    
    // Reload moonlink events
    const moonlinkEvents = path.join(eventsPath, 'moonlink');
    if (fs.existsSync(moonlinkEvents)) {
      for (const file of fs.readdirSync(moonlinkEvents).filter(f => f.endsWith('.js'))) {
        const fullPath = path.join(moonlinkEvents, file);
        delete require.cache[require.resolve(fullPath)];
        reloaded.events++;
      }
    }
    
    // Reload client events
    const clientEvents = path.join(eventsPath, 'client');
    if (fs.existsSync(clientEvents)) {
      for (const file of fs.readdirSync(clientEvents).filter(f => f.endsWith('.js'))) {
        const fullPath = path.join(clientEvents, file);
        delete require.cache[require.resolve(fullPath)];
        reloaded.events++;
      }
    }
    
    // Reset commands so next call reloads fresh
    global.__hakariCommands = null;
    
    logger.info(`Hot reload: ${reloaded.commands} commands, ${reloaded.events} events, ${reloaded.structures} structures`);
    
    return { success: true, ...reloaded };
    
  } catch (err) {
    logger.error(`Hot reload failed: ${err.message}`);
    return { success: false, reason: err.message };
  }
}

module.exports = {
  name: 'reload',
  aliases: ['rl', 'sync'],
  execute: async (client, message, args) => {
    try {
      const result = reloadAll();
      
      if (result.success) {
        await message.channel.send(successMsg(
          `Reloaded!\n\n${e('track')} ${result.commands} commands\n${e('queue')} ${result.events} events\n⚙️ ${result.structures} structures`
        ));
      } else {
        await message.channel.send(errorMsg('Reload Failed', result.reason || 'Unknown error'));
      }
    } catch (err) {
      message.channel.send(errorMsg('Error', err.message));
    }
  }
};