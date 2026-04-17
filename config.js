const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    spotify: {
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    },
    nodes: [
        {
            identifier: "main",
            host: process.env.LAVALINK_HOST || "de29.spaceify.eu",
            password: process.env.LAVALINK_PASSWORD || "youshallnotpass",
            port: parseInt(process.env.LAVALINK_PORT) || 25910,
            secure: process.env.LAVALINK_SECURE === "true" || false,
        }
    ],

    prefix: process.env.PREFIX || ".",
    autoplay: process.env.AUTOPLAY === "true" || true,
    cleanTimeout: parseInt(process.env.CLEAN_TIMEOUT) || 15000,
    twentyFourSeven: process.env.TWENTY_FOUR_SEVEN === "true" || true
};