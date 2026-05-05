const path = require('path');
const config = require('../../structures/config');
const logger = require('../../structures/logger');
const { rejectMessage } = require('../../structures/builders');
const { exec } = require('child_process');
const util = require('util');

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
    if (message.author.bot) return;
    const ownerId = process.env.OWNER_ID;
    const isOwner = ownerId && message.author.id === ownerId;
    if (message.content.startsWith(">")) {
      if (!isOwner) return;
      const evalAsync = () => {
        return new Promise(async (resolve, reject) => {
          try {
            let evaled = /await/i.test(message.content.slice(1))
              ? await eval("(async() => { " + message.content.slice(1) + " })()")
              : await eval(message.content.slice(1));
            if (typeof evaled !== "string") evaled = util.inspect(evaled);
            resolve(evaled);
          } catch (err) {
            reject(err);
          }
        });
      };
      evalAsync()
        .then((result) => message.reply(`\`\`\`json\n${result}\n\`\`\``))
        .catch((err) => message.reply(`\`\`\`json\n${err}\n\`\`\``));
      return;
    } else if (message.content.startsWith("$")) {
      if (!isOwner) return;
      message.reply("Executing...");
      exec(message.content.slice(1), async (err, stdout) => {
        if (err) return message.reply(`\`\`\`json\n${err}\n\`\`\``);
        if (stdout) return message.reply(`\`\`\`json\n${stdout}\n\`\`\``);
      });
      return;
    }
    if (!global.db.data.guilds[message.guildId]) {
      global.db.data.guilds[message.guildId] = {
      message: null,
      autoplay: true,
      defaultPlatform: 'Spotify',
      prefix: config.prefix,
      volume: 100,
      };
      await global.db.write();
    }

    if (!message.content.startsWith(config.prefix)) return;
    //console.log(JSON.stringify(message,null,2))
    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
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

    // Check owner-only commands
    if (command.ownerOnly) {
      const ownerId = process.env.OWNER_ID;
      if (!ownerId || message.author.id !== ownerId) {
        return message.channel.send(rejectMessage('Only bot owner can use this command.'));
      }
    }

    async function sendRejection(reason) {
      const msg = await message.channel.send(rejectMessage(reason));
      // setTimeout(() => msg.delete().catch(() => {}), 3000);
    }

    const VOICE_REQUIRED = ['skip', 'pause', 'resume', 'stop', 'loop', 'shuffle', 'autoplay', 'play', 'queue', 'lyrics'];
    const REQUESTER_REQUIRED = ['pause', 'resume', 'stop', 'loop', 'shuffle', 'autoplay'];

    if (VOICE_REQUIRED.includes(command.name)) {
      const player = client.manager?.players.get(message.guild.id);
      const userVoice = message.member.voice.channel;

      if (!userVoice) {
        return sendRejection("You must be in the voice channel to use this.");
      }

      if (player && userVoice.id !== player.voiceChannelId) {
        return sendRejection("You must be in the voice channel to use this.");
      }

      if (REQUESTER_REQUIRED.includes(command.name)) {
        if (player?.current?.requester && message.author.id !== player.current.requester.id) {
          return sendRejection("Only the requester can use this control.");
        }
      }

      if (command.name === 'skip') {
        if (player?.current?.requester && message.author.id !== player.current.requester.id) {
          player.skipVotes = player.skipVotes || new Set();
          if (player.skipVotes.has(message.author.id)) {
            return sendRejection("You have already voted to skip.");
          }
          player.skipVotes.add(message.author.id);
          const required = Math.ceil(userVoice.members.filter(m => !m.user.bot).size / 2);
          if (player.skipVotes.size < required) {
            return sendRejection(`Skipping, ${player.skipVotes.size}/${required} (${required - player.skipVotes.size} votes needed)`);
          }
          player.skipVotes = new Set();
        }
      }
    }

    try {
      await command.execute(client, message, args);
    } catch (err) {
      logger.error(`in messageCreate: Command ${commandName} failed: ${err.message}`);
      message.reply('An error occurred.').catch(() => { });
    }
  }
};