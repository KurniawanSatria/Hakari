// moonlink.js
const fs = require("fs");
const path = require("path");
const { Manager, Connectors } = require("moonlink.js");
const config = require("./config");
const logger = require("./logging");

function initMusic(client) {
    if (!client) {
        throw new Error("Client instance is required");
    }

    // Initialize clean mode storage
    client.cleanMode = new Map();

    // Validate configuration
    if (!config.nodes || !Array.isArray(config.nodes) || config.nodes.length === 0) {
        throw new Error("Invalid Lavalink node configuration");
    }

    try {
        // Initialize clean mode storage
        client.cleanMode = new Map();

        // create Moonlink manager and attach to client
        client.manager = new Manager({
            nodes: config.nodes,
            options: {
                clientName: "Hakari/1.0.0",
                node: {
                    selectionStrategy: "leastLoad",
                    avoidUnhealthyNodes: true,
                    autoMovePlayers: true,
                    retryAmount: 10,
                    retryDelay: 5000
                },
            },
            send: (guildId, payload) => {
                const guild = client.guilds.cache.get(guildId);
                if (guild) guild.shard.send(payload);
            },
        });

        client.manager.use(new Connectors.DiscordJs(), client);

        // Auto-load Moonlink events
        const eventsPath = path.join(__dirname, "events/moonlink");
        for (const file of fs.readdirSync(eventsPath).filter(f => f.endsWith(".js"))) {
            const eventName = file.replace(".js", "");
            const handler = require(path.join(eventsPath, file));
            if (typeof handler.execute !== "function") {
                logger.warn(`Skipping moonlink event ${file}: missing execute`);
                continue;
            }
            client.manager.on(eventName, (...args) => handler.execute(client, ...args));
        }

        logger.info(`Moonlink initialized successfully`);
    } catch (error) {
        logger.error(`Failed to initialize Moonlink: ${error.message}`, error);
        throw error;
    }
}

module.exports = { initMusic };
