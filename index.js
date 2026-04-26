const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const { Manager, Connectors } = require('moonlink.js');
const logger = require('./src/structures/logger');
const config = require('./src/structures/config');
const figlet = require('figlet');
const chalk = require('chalk');


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
  client.manager = new Manager({
    nodes: config.nodes,
    options: {
      debug: true,
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
    
    await client.login(config.token);
    logger.info(`Loaded: ${client.commands.size} commands`);
  } catch (err) {
    logger.error(`Failed to start: ${err.message}`, { stack: err.stack });
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  logger.warn('Received SIGINT, shutting down...');
  client.destroy();
  process.exit(0);
});

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled rejection: ${err.message}`, { stack: err.stack });
});

start();