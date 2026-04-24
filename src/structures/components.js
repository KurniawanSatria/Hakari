// src/structures/components.js - Raw JSON Constants (no functions)

const fs = require('fs');
const path = require('path');

// Load custom emojis
let EMOJIS = {};
try {
  const emojisPath = path.join(__dirname, '../../emojis.json');
  if (fs.existsSync(emojisPath)) {
    const raw = fs.readFileSync(emojisPath, 'utf8');
    if (raw && raw.trim()) {
      const emojisData = JSON.parse(raw);
      for (const e of emojisData) EMOJIS[e.name] = e;
    }
  }
} catch (e) {
  console.error('Failed to load emojis:', e.message);
}

// Get emoji by name
function getEmoji(name) {
  const e = EMOJIS[name];
  return e ? { name: e.name, id: e.id } : null;
}

// Constants
const ACCENT_COLOR = 16687280;
const FALLBACK_THUMB = 'https://files.catbox.moe/fnlch5.jpg';
const NOW_PLAYING_GIF = 'https://i.ibb.co.com/ksXKzFg1/Now-Playing.gif';

module.exports = {
  ACCENT_COLOR,
  FALLBACK_THUMB,
  NOW_PLAYING_GIF,
  getEmoji,
  EMOJIS
};