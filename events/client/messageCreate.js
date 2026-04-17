// events/client/messageCreate.js

const config = require("../../config");
const { log } = require("style-logs");
const fs = require("fs");
const path = require("path");

function loadCommands() {
  const commands = new Map();
  const aliases = new Map();
  const commandsPath = path.join(__dirname, "../../commands");

  for (const file of fs
    .readdirSync(commandsPath)
    .filter((f => f.endsWith(".js")))) {
    try {
      const fullPath = path.join(commandsPath, file);
      delete require.cache[require.resolve(fullPath)];
      const command = require(fullPath);
      if (!command.execute) {
        log(`{badge: warning}Skipping ${file}: missing execute{/}`);
        continue;
      }
      const name = file.replace(".js", "");
      commands.set(name, command);
      log(`{badge: success}Loaded: ${name}{/}`);

      // Handle aliases
      if (command.aliases && Array.isArray(command.aliases)) {
        for (const alias of command.aliases) {
          aliases.set(alias, name);
        }
      }
    } catch (err) {
      log(`{border: red}Failed loading ${file}: ${err.message}{/}`);
    }
  }

  log(`{border: blue}[CMD] ${commands.size} commands active{/}`);
  return { commands, aliases };
}

let { commands, aliases } = loadCommands();

const reply = async (message, content) => {
  return await message.reply({
    content,
    allowedMentions: { repliedUser: false }
  }).catch(() => {});
};

module.exports = {
    name: "messageCreate",
    execute: async (client, message) => {
        // Ignore bot messages
        if (message.author.bot) return;
        message.suppressEmbeds().catch(() => {});
        // --- clean mode handling ------------------------------------------------
        // only apply for guilds (ignore DMs)
        const guildId = message.guild?.id;

        // if it's a message from this bot and clean mode is active, schedule deletion
        // skip the special "track start" cards which already clean themselves on trackEnd
        if (message.author.id === client.user.id && isClean) {
            const hasTrackArt = message.attachments?.some(att => att.name === "trackStart.png");
            const ignoreFlag = message.cleanIgnore;
            if (!hasTrackArt && !ignoreFlag) {
                setTimeout(() => message.delete().catch(() => {}), client.cleanTimeout);
            }
        }
        // ------------------------------------------------------------------------

        // --- Prefix command handling -------------------------------------------
        if (!message.content.startsWith(config.prefix)) return;

        const args = message.content.slice(config.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        let command = commands.get(commandName);
        if (!command) {
          // Check aliases
          const aliasCommand = aliases.get(commandName);
          if (aliasCommand) {
            command = commands.get(aliasCommand);
          }
        }
        if (!command) return;

        try {
            await command.execute(client, message, args);
        } catch (error) {
            log(`{border: red}Error executing command "${commandName}": ${error.message}{/}`);
            await reply(message, "An error occurred while executing the command.");
        }
        // ------------------------------------------------------------------------
    },
};