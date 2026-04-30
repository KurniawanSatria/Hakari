const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const { Manager, Connectors } = require('moonlink.js');
const logger = require('./src/structures/logger');
const config = require('./src/structures/config');
const { validateConfig } = require('./src/structures/config');
const figlet = require('figlet');
const chalk = require('chalk');


try {
  validateConfig();
} catch (err) {
  logger.error(err.message);
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

function initMoonlink() {
  try {
    client.manager = new Manager({
      nodes: config.nodes,
      options: {
        debug: false, // Set to true only for development
        clientName: 'Hakari',
        node: {
          selectionStrategy: 'leastLoad',
          avoidUnhealthyNodes: true,
          autoMovePlayers: true,
          maxCpuLoad: 75,
          maxMemoryUsage: 0.7,
          retryAmount: 5, // Increased retry attempts
          retryDelay: 3000, // Increased retry delay
          resumeTimeout: 60000, // Timeout for resume attempts
          heartBeatInterval: 10000 // Heartbeat to detect dead connections
        },
        player: {
          resumeTimeout: 300000, // Keep player alive for 5 minutes between tracks
          resumeByAddress: true,
          address: '0.0.0.0'
        }
      },
      send: (guildId, payload) => {
        try {
          const guild = client.guilds.cache.get(guildId);
          if (guild && guild.shard) {
            guild.shard.send(payload);
          } else {
            logger.warn(`Guild ${guildId} not found for voice payload`);
          }
        } catch (err) {
          logger.error(`Error sending voice payload: ${err.message}`);
        }
      }
    });

    client.manager.use(new Connectors.DiscordJs(), client);
    
    // Add manager-level error handlers
    client.manager.on('error', (error, payload) => {
      logger.error(`Manager error: ${error.message}`, { payload });
    });

    // Node disconnect/error/reconnect events are handled in src/events/moonlink/
    // nodeError.js, nodeDisconnect.js, and nodeConnected.js with automatic failover

    logger.info('MoonLink manager initialized successfully');
    return client.manager;
  } catch (err) {
    logger.error(`Failed to initialize MoonLink manager: ${err.message}`, { stack: err.stack });
    throw err;
  }
}

function loadHandlers() {
  const eventsPath = path.join(__dirname, 'src/events');
  const moonlinkEvents = path.join(eventsPath, 'moonlink');
  if (fs.existsSync(moonlinkEvents)) {
    for (const file of fs.readdirSync(moonlinkEvents).filter(f => f.endsWith('.js'))) {
      try {
        const handler = require(path.join(moonlinkEvents, file));
        if (typeof handler.register === 'function') {
          handler.register(client);
          logger.info(`Moon link Event Loaded: ${handler.name}`);
        }
      } catch (err) {
        logger.error(`Failed to load moonlink event ${file}: ${err.message}`);
      }
    }
  }

  const clientEvents = path.join(eventsPath, 'client');
  if (fs.existsSync(clientEvents)) {
    for (const file of fs.readdirSync(clientEvents).filter(f => f.endsWith('.js'))) {
      try {
        const eventName = file.replace('.js', '');
        const handler = require(path.join(clientEvents, file));
        if (typeof handler.execute === 'function') {
          client.on(eventName, (...args) => handler.execute(client, ...args));
          logger.info(`Client Event Loaded: ${eventName}`);
        }
      } catch (err) {
        logger.error(`Failed to load client event ${file}: ${err.message}`);
      }
    }
  }
}

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
          logger.info(`Command Loaded: ${file.replace('.js', '')}`);

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

async function start() {
  console.clear();
  try {
    const banner = await new Promise((resolve, reject) => {
      figlet.text(
        'Hakari',
        {
          font: 'Bloody',
          horizontalLayout: 'default',
          verticalLayout: 'default',
          width: 80,
          whitespaceBreak: true
        },
        (err, data) => {
          if (err) return reject(err)
          resolve(data)
        }
      )
    })
    console.log(chalk.hex('#ff69b4')(banner))
    console.log(chalk.hex('#ffffff')('v2.1'))
    console.log(chalk.hex('#05ffea')('Created by Saturia.'))
    initMoonlink();
    loadHandlers();
    loadCommands();

    await Promise.race([
      client.login(config.token),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Login timed out after 30 seconds')), 30000)
      )
    ]);
    logger.info(`Loaded: ${client.commands.size} commands`);
  } catch (err) {
    logger.error(`Failed to start: ${err.message}`, { stack: err.stack });
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  logger.info('Shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled rejection: ${err.message}`, { stack: err.stack });
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught exception: ${err.message}`, { stack: err.stack });
  process.exit(1);
});

start();