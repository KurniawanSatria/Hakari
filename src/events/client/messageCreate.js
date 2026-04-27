const path = require('path');
const config = require('../../structures/config');
const logger = require('../../structures/logger');
const { rejectMessage } = require('../../structures/builders');

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
    if (!message.content.startsWith(config.prefix)) return;
    //message.suppressEmbeds().catch(() => { });
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