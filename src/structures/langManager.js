const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const languages = {};
const guildSettings = {};
const SETTINGS_PATH = path.join(__dirname, '../../data/guildLang.json');

// Load all language files from lang/ directory
function init() {
  const langDir = path.join(__dirname, 'lang');
  for (const file of fs.readdirSync(langDir).filter(f => f.endsWith('.js'))) {
    const langCode = file.replace('.js', '');
    languages[langCode] = require(path.join(langDir, file));
  }
  // Load saved guild settings
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      Object.assign(guildSettings, JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8')));
    }
  } catch (err) {
    logger.error(`Failed to load guild language settings: ${err.stack || err}`);
  }
}

function get(guildId) {
  const lang = guildSettings[guildId] || 'id'; // Default Indonesian
  return languages[lang] || languages['id'];
}

function set(guildId, langCode) {
  if (!languages[langCode]) return false;
  guildSettings[guildId] = langCode;
  // Save to file
  try {
    const dir = path.dirname(SETTINGS_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(guildSettings, null, 2));
  } catch (err) {
    logger.error(`Failed to save guild language settings: ${err.stack || err}`);
  }
  return true;
}

function getAvailableLanguages() {
  return Object.keys(languages);
}

function getLangName(code) {
  const names = { id: 'Bahasa Indonesia', en: 'English' };
  return names[code] || code;
}

module.exports = { init, get, set, getAvailableLanguages, getLangName };
