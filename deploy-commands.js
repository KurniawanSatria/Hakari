const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { log } = require("style-logs");
const commands = [];

// Load commands from commands/ directory
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if (command.data) {
        commands.push(command.data.toJSON());
    }
}

const rest = new REST({ version: '9' }).setToken(config.token);

(async () => {
    try {
        log('{badge: success}Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(config.clientId), // Replace with your client ID
            { body: commands },
        );

        log('{badge: success}Successfully reloaded application (/) commands.');
    } catch (error) {
        log('{border: red}Error occurred while refreshing commands: ${error.message}{/}');
    }
})();
