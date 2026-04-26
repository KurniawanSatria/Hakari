// src/structures/config.js - Configuration management

require('dotenv').config();
const logger = require('./logger');

function parseBool(value, defaultVal = false) {
  if (value === undefined || value === null || value === '') return defaultVal;
  return value.toLowerCase() === 'true';
}

function validateConfig() {
  const required = [
    'DISCORD_TOKEN',
    'CLIENT_ID',
    'LAVALINK_HOST',
    'LAVALINK_PORT',
    'LAVALINK_PASSWORD'
  ];

  const missing = required.filter(key => {
    const value = process.env[key];
    return value === undefined || value === null || value.trim() === '';
  });

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const optional = ['PREFIX', 'AUTOPLAY', 'TWENTY_FOUR_SEVEN'];
  for (const key of optional) {
    const value = process.env[key];
    if (value === undefined || value === null || value === '') {
      logger.warn(`Optional environment variable ${key} is not set, using default value.`);
    }
  }
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
  
  // Lavalink/NodeLink nodes (primary + backups)
  nodes: [
    {
      identifier: 'Hakari Main',
      host: process.env.LAVALINK_HOST,
      password: process.env.LAVALINK_PASSWORD,
      port: parseIntDefault(process.env.LAVALINK_PORT, 2333),
      secure: parseBool(process.env.LAVALINK_SECURE, false),
      priority: 0
    },
    // Backup nodes (optional - will be added if env vars are set)
    ...(process.env.LAVALINK_HOST_1 && process.env.LAVALINK_PASSWORD_1 ? [
      {
        identifier: 'Hakari Backup 1',
        host: process.env.LAVALINK_HOST_1,
        password: process.env.LAVALINK_PASSWORD_1,
        port: parseIntDefault(process.env.LAVALINK_PORT_1, 2333),
        secure: parseBool(process.env.LAVALINK_SECURE_1, false),
        priority: 1
      }
    ] : []),
    ...(process.env.LAVALINK_HOST_2 && process.env.LAVALINK_PASSWORD_2 ? [
      {
        identifier: 'Hakari Backup 2',
        host: process.env.LAVALINK_HOST_2,
        password: process.env.LAVALINK_PASSWORD_2,
        port: parseIntDefault(process.env.LAVALINK_PORT_2, 2333),
        secure: parseBool(process.env.LAVALINK_SECURE_2, false),
        priority: 2
      }
    ] : [])
  ],
  
  // Bot settings
  prefix: process.env.PREFIX || '.',
  autoplay: parseBool(process.env.AUTOPLAY, true),
  cleanTimeout: parseIntDefault(process.env.CLEAN_TIMEOUT, 15000),
  twentyFourSeven: parseBool(process.env.TWENTY_FOUR_SEVEN, false),
  validateConfig
};