// events/client/messageCreate.js

const config = require("../../config");
const { log } = require("style-logs");
const fs = require("fs");
const path = require("path");

function loadCommands() {
    const commands = new Map();
    const aliases = new Map();
    const commandsPath = path.join(__dirname, "../../commands");

    for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"))) {
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

module.exports = {
    name: "messageCreate",
    execute: async (client, message) => {
        if (message.author.bot) return;

        message.suppressEmbeds().catch(() => {});

        const guildId = message.guild?.id;

        // Clean mode: auto-delete bot messages (excluding track cards)
        if (guildId && message.author.id === client.user.id) {
            const isClean = client.cleanMode?.get(guildId) ?? false;
            if (isClean && !message.cleanIgnore) {
                const cleanTimeout = config.cleanTimeout ?? 15000;
                setTimeout(() => message.delete().catch(() => {}), cleanTimeout);
            }
        }

        if (!message.content.startsWith(config.prefix)) return;

        const args = message.content.slice(config.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        let command = commands.get(commandName);
        if (!command) {
            const aliasTarget = aliases.get(commandName);
            if (aliasTarget) command = commands.get(aliasTarget);
        }
        if (!command) return;

        // Clean mode: also auto-delete the invoking user's command message
        if (guildId && (client.cleanMode?.get(guildId) ?? false)) {
            const cleanTimeout = config.cleanTimeout ?? 15000;
            setTimeout(() => message.delete().catch(() => {}), cleanTimeout);
        }

        try {
            await command.execute(client, message, args);
        } catch (error) {
            log(`{border: red}Error executing command "${commandName}": ${error.message}{/}`);
            await message.reply({
                flags: 32768,
                components: [{ type: 17, components: [{ type: 10, content: "An error occurred while executing the command." }] }]
            }).catch(() => {});
        }
    },
};