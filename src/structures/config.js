// src/structures/config.js - Configuration management

require('dotenv').config();

function parseBool(value, defaultVal = false) {
  if (value === undefined || value === null || value === '') return defaultVal;
  return value.toLowerCase() === 'true';
}

function parseIntDefault(value, defaultVal = 0) {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultVal : parsed;
}

module.exports = {
  // Discord
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  
  // Spotify
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET
  },
  
  // Lavalink/NodeLink nodes
  nodes: [
    {
      identifier: 'Hakari',
      host: 'node.saturia.codes',
      password: 'youshallnotpass',
      port: 1235,
      secure: false
    },
    // {
    //   identifier: 'Hakari Backup',
    //   host: process.env.LAVALINK_HOST || 'localhost',
    //   password: process.env.LAVALINK_PASSWORD || 'youshallnotpass',
    //   port: parseIntDefault(process.env.LAVALINK_PORT, 2333),
    //   secure: parseBool(process.env.LAVALINK_SECURE, false)
    // }
  ],
  
  // Bot settings
  prefix: process.env.PREFIX || '.',
  autoplay: parseBool(process.env.AUTOPLAY, true),
  cleanTimeout: parseIntDefault(process.env.CLEAN_TIMEOUT, 15000),
  twentyFourSeven: parseBool(process.env.TWENTY_FOUR_SEVEN, false)
};