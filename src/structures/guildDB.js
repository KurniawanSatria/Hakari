const { Low } = require('lowdb');
const { JSONFileSync } = require('lowdb/node');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbFile = path.join(dataDir, 'guilds.json');

const defaultData = {
  guilds: {}
};

function createGuildDefaults(guildId) {
  return {
    prefix: '.',
    language: 'en',
    autoplay: true,
    volume: 100,
    cleanTimeout: 60000,
    twentyFourSeven: false,
    defaultSearch: 'spsearch',
    maxQueueSize: 1000,
    djRoles: [],
    voteSkip: true,
    voteSkipRatio: 0.5,
    nowPlayingEnabled: true,
    lyricsEnabled: true,
    announceChannelId: null,
    requestChannelId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

class GuildDB {
  constructor() {
    this.adapter = new JSONFileSync(dbFile);
    this.db = new Low(this.adapter, defaultData);
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.db.read();
    this.db.data ||= defaultData;
    this.db.data.guilds ||= {};
    this.db.write();
    this.initialized = true;
  }

  getGuild(guildId) {
    this.init();
    if (!this.db.data.guilds[guildId]) {
      this.db.data.guilds[guildId] = createGuildDefaults(guildId);
      this.db.write();
    } else {
      const defaults = createGuildDefaults(guildId);
      const guild = this.db.data.guilds[guildId];
      for (const key of Object.keys(defaults)) {
        if (guild[key] === undefined) {
          guild[key] = defaults[key];
        }
      }
      this.db.write();
    }
    return this.db.data.guilds[guildId];
  }

  setGuildSetting(guildId, key, value) {
    this.init();
    const guild = this.getGuild(guildId);
    guild[key] = value;
    guild.updatedAt = new Date().toISOString();
    this.db.write();
    return guild;
  }

  getGuildSetting(guildId, key, defaultValue = null) {
    this.init();
    const guild = this.getGuild(guildId);
    return guild[key] !== undefined ? guild[key] : defaultValue;
  }

  getAllGuilds() {
    this.init();
    return this.db.data.guilds;
  }

  deleteGuild(guildId) {
    this.init();
    if (this.db.data.guilds[guildId]) {
      delete this.db.data.guilds[guildId];
      this.db.write();
    }
  }

  resetGuild(guildId) {
    this.init();
    this.db.data.guilds[guildId] = createGuildDefaults(guildId);
    this.db.write();
    return this.db.data.guilds[guildId];
  }

  migrateAllGuilds() {
    this.init();
    const defaults = createGuildDefaults();
    let migrated = 0;
    
    for (const guildId of Object.keys(this.db.data.guilds)) {
      const guild = this.db.data.guilds[guildId];
      let needsUpdate = false;
      
      for (const key of Object.keys(defaults)) {
        if (guild[key] === undefined) {
          guild[key] = defaults[key];
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        guild.updatedAt = new Date().toISOString();
        migrated++;
      }
    }
    
    if (migrated > 0) {
      this.db.write();
    }
    
    return migrated;
  }
}

module.exports = new GuildDB();
