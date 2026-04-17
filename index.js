const { Client, GatewayIntentBits, Events } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { initMusic } = require("./moonlink");
const config = require("./config");
const logger = require("./logging");


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ],
});


initMusic(client);

// Auto-load client events from events/client/
const clientEventsPath = path.join(__dirname, "events/client");
for (const file of fs.readdirSync(clientEventsPath).filter(f => f.endsWith(".js"))) {
    const eventName = file.replace(".js", "");
    const handler = require(path.join(clientEventsPath, file));
    if (typeof handler.execute !== "function") {
        logger.warn(`Skipping client event ${file}: missing execute`);
        continue;
    }
    client.on(eventName, (...args) => handler.execute(client, ...args));
}


client.once(Events.ClientReady, async () => {
    logger.info(`Logged in as ${client.user.tag}`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    await loadGuildSettings();
});


async function loadGuildSettings() {
    // Load guild settings from database or file
    logger.info(`Guild settings loaded`);
}


login();

process.on('unhandledRejection', error => {
    logger.error(`Unhandled Rejection: ${error.message}`, error);
    cleanupAndExit(1);
});

process.on('uncaughtException', error => {
    logger.error(`Uncaught Exception: ${error.message}`, error);
    cleanupAndExit(1);
});

process.on('SIGINT', () => {
    logger.info(`Received SIGINT, shutting down gracefully`);
    cleanupAndExit(0);
});

process.on('SIGTERM', () => {
    logger.info(`Received SIGTERM, shutting down gracefully`);
    cleanupAndExit(0);
});

async function login() {
    try {
        await client.login(config.token);
        logger.info(`Bot successfully logged in`);
    } catch (error) {
        logger.error(`Failed to login: ${error.message}`, error);
        cleanupAndExit(1);
    }
}

async function cleanupAndExit(code) {
    logger.info(`Cleaning up before exit...`);
    try {
        await client.destroy();
        logger.info(`Client destroyed successfully`);
    } catch (error) {
        logger.error(`Error during cleanup: ${error.message}`, error);
    }
    process.exit(code);
}
