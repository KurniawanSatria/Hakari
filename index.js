// Hakari Music Bot - Main Entry Point
// A Discord music bot with lyrics sync support using Moonlink.js + NodeLink

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const { Manager, Connectors } = require('moonlink.js');
const logger = require('./src/structures/logger');
const config = require('./src/structures/config');

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// Initialize Moonlink Manager
function initMoonlink() {
  client.manager = new Manager({
    nodes: config.nodes,
    options: {
      clientName: 'Hakari/v2.0',
      node: {
        selectionStrategy: 'leastLoad',
        avoidUnhealthyNodes: true,
        autoMovePlayers: true,
        retryAmount: 3,
        retryDelay: 2000
      },
      playerHealth: {
        enabled: false,
        staleTime: 10000,
        maxBufferDiff: 1000
      }
    },
    send: (guildId, payload) => {
      const guild = client.guilds.cache.get(guildId);
      if (guild) guild.shard?.send(payload);
    }
  });

  client.manager.use(new Connectors.DiscordJs(), client);
  return client.manager;
}

// Load event handlers
function loadHandlers() {
  const eventsPath = path.join(__dirname, 'src/events');
  
  // Load moonlink events
  const moonlinkEvents = path.join(eventsPath, 'moonlink');
  if (fs.existsSync(moonlinkEvents)) {
    for (const file of fs.readdirSync(moonlinkEvents).filter(f => f.endsWith('.js'))) {
      try {
        const handler = require(path.join(moonlinkEvents, file));
        if (typeof handler.register === 'function') {
          handler.register(client);
          logger.info(`Loaded moonlink event: ${handler.name}`);
        }
      } catch (err) {
        logger.error(`Failed to load moonlink event ${file}: ${err.message}`);
      }
    }
  }
  
  // Load client events
  const clientEvents = path.join(eventsPath, 'client');
  if (fs.existsSync(clientEvents)) {
    for (const file of fs.readdirSync(clientEvents).filter(f => f.endsWith('.js'))) {
      try {
        const eventName = file.replace('.js', '');
        const handler = require(path.join(clientEvents, file));
        if (typeof handler.execute === 'function') {
          client.on(eventName, (...args) => handler.execute(client, ...args));
          logger.info(`Loaded client event: ${eventName}`);
        }
      } catch (err) {
        logger.error(`Failed to load client event ${file}: ${err.message}`);
      }
    }
  }
}

// Load commands
function loadCommands() {
  const commandsPath = path.join(__dirname, 'src/commands');
  client.commands = new Map();
  client.aliases = new Map();
  
  if (fs.existsSync(commandsPath)) {
    for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
      try {
        const cmd = require(path.join(commandsPath, file));
        if (cmd.execute) {
          client.commands.set(file.replace('.js', ''), cmd);
          logger.info(`Loaded command: ${file.replace('.js', '')}`);
          
          if (cmd.aliases) {
            for (const alias of cmd.aliases) {
              client.aliases.set(alias, file.replace('.js', ''));
            }
          }
        }
      } catch (err) {
        logger.error(`Failed to load command ${file}: ${err.message}`);
      }
    }
  }
}

// Setup file watcher for hot-reload (delayed start)
function setupWatcher() {
  // Delay starting watcher to ensure nodes are fully initialized
  setTimeout(() => {
    const watchPaths = [
      path.join(__dirname, 'src/commands'),
      path.join(__dirname, 'src/events'),
      path.join(__dirname, 'src/structures')
    ];
    
    let reloadTimeout = null;
    
    for (const watchPath of watchPaths) {
      if (fs.existsSync(watchPath)) {
        fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
          if (filename && filename.endsWith('.js')) {
            logger.info(`[Watcher] ${eventType}: ${filename}`);
            
            // Debounce reloads
            clearTimeout(reloadTimeout);
            reloadTimeout = setTimeout(() => {
              const fullPath = path.join(watchPath, filename);
              delete require.cache[require.resolve(fullPath)];
              
              // Reload commands if changed
              if (watchPath.includes('commands')) {
                loadCommands();
                logger.info(`Reloaded commands: ${client.commands.size} loaded`);
              }
              
              // Reload handlers if events/structures changed
              if (watchPath.includes('events') || watchPath.includes('structures')) {
                loadHandlers();
                logger.info('Reloaded handlers');
              }
            }, 500);
          }
        });
      }
    }
    
    logger.info('File watcher active (delayed start)');
  }, 5000); // Wait 5 seconds after login before starting watcher
}

// Login and start
async function start() {
  try {
    initMoonlink();
    loadHandlers();
    loadCommands();
    
    await client.login(config.token);
    logger.info('Hakari Music Bot started successfully');
    logger.info(`Loaded: ${client.commands.size} commands`);
    
    // Setup watcher after everything is ready
    setupWatcher();
  } catch (err) {
    logger.error(`Failed to start: ${err.message}`, { stack: err.stack });
    process.exit(1);
  }
}

// Handle shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down...');
  client.destroy();
  process.exit(0);
});

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled rejection: ${err.message}`, { stack: err.stack });
});

start();