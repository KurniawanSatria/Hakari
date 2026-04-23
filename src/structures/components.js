// src/structures/components.js - Raw JSON ComponentV2 helpers

const fs = require('fs');
const path = require('path');

// Load custom emojis (robust loading)
let EMOJIS = {};
try {
  const emojisPath = path.join(__dirname, '../../emojis.json');
  if (fs.existsSync(emojisPath)) {
    const raw = fs.readFileSync(emojisPath, 'utf8');
    if (raw && raw.trim()) {
      const emojisData = JSON.parse(raw);
      for (const e of emojisData) {
        EMOJIS[e.name] = e;
      }
    }
  }
} catch (e) {
  console.error('Failed to load emojis:', e.message);
}

// Emoji helper
function getEmoji(name) {
  const e = EMOJIS[name];
  if (!e) return null;
  return { name: e.name, id: e.id };
}

// Get emoji name string
function e(name) {
  const emoji = getEmoji(name);
  return emoji ? emoji.name : '';
}

const FALLBACK_THUMB = 'https://files.catbox.moe/fnlch5.jpg';

// Wrap in container
function wrap(...items) {
  return {
    flags: 32768,
    components: [{
      type: 17,
      components: items.filter(Boolean)
    }]
  };
}

// Separator
function separator() {
  return { type: 14, divider: true };
}

// Section with thumbnail
function sectionWithThumb(label, thumb) {
  const sec = {
    type: 9,
    components: [{
      type: 10,
      content: label
    }]
  };
  
  if (thumb) {
    sec.accessory = {
      type: 11,
      media: { url: thumb },
      description: 'thumbnail'
    };
  }
  
  return sec;
}

// Now playing with controls
function nowPlaying(track, requester, duration) {
  return wrap(
    sectionWithThumb(
      `### <:musicalnote:1482113385486352586> Now Playing\n**${track.title}**\n${track.author}\n\n${e('duration')} \`${duration}\` • ${e('requester')} ${requester}`,
      track.thumbnail || FALLBACK_THUMB
    ),
    separator(),
    {
      type: 1,
      components: [
        { style: 4, type: 2, custom_id: 'stop', label: 'Stop', emoji: getEmoji('stop') },
        { style: 1, type: 2, custom_id: 'skip', label: 'Skip', emoji: getEmoji('skip') }
      ]
    }
  );
}

// Track added to queue
function trackAdded(track, position, queueSize, duration, isPlaying) {
  return wrap(
    sectionWithThumb(
      `### ${e('track')} Added to Queue\n**[${track.title}](${track.uri})**\n${track.author}\n\n${e('duration')} \`${duration}\``,
      track.thumbnail || FALLBACK_THUMB
    ),
    { type: 10, content: `-# ${e('pos')} Position: \`${isPlaying ? '#' + (position + 1) : 'Up next'}\` • ${e('queue')} Queue: \`${queueSize} tracks\`` }
  );
}

// Playlist added
function playlistAdded(name, trackCount, duration, thumb) {
  return wrap(
    sectionWithThumb(
      `### ${e('queue')} Playlist Loaded: **${name}**\n\n${e('track')} \`${trackCount}\` tracks • ${e('duration')} \`${duration}\``,
      thumb || FALLBACK_THUMB
    )
  );
}

// Queue list
function queueList(current, tracks, totalDuration) {
  let desc = current 
    ? `**${e('play')} Now Playing:** [${current.title}](${current.uri})\n\n`
    : '';
  
  desc += `**Up Next:**\n`;
  desc += tracks.slice(0, 10).map((t, i) => 
    `${i + 1}. ${t.title} - ${t.author}`
  ).join('\n');
  
  if (tracks.length > 10) {
    desc += `\n... and ${tracks.length - 10} more`;
  }
  
  return wrap(
    sectionWithThumb(
      `### ${e('queue')} Music Queue\n\n${desc}`,
      current?.thumbnail || FALLBACK_THUMB
    ),
    separator(),
    { type: 10, content: `-# Total: ${tracks.length} tracks • ${totalDuration}` }
  );
}

// Error message
function errorMsg(title, description) {
  return {
    flags: 32768,
    components: [{
      type: 17,
      components: [{
        type: 10,
        content: `### ${title}\n${description}`
      }],
      accent_color: 16056337
    }]
  };
}

// Success message
function successMsg(description) {
  return {
    flags: 32768,
    components: [{
      type: 17,
      components: [{
        type: 10,
        content: `### ${description}`
      }],
      accent_color: 65388
    }]
  };
}

// Now playing confirmation
function nowPlayingConfirm(trackTitle) {
  return {
    flags: 32768,
    components: [{
      type: 17,
      components: [{
        type: 10,
        content: `### Now Playing\n\n**${trackTitle}**`
      }]
    }]
  };
}

module.exports = {
  wrap,
  sectionWithThumb,
  separator,
  nowPlaying,
  trackAdded,
  playlistAdded,
  queueList,
  errorMsg,
  successMsg,
  nowPlayingConfirm,
  FALLBACK_THUMB,
  getEmoji,
  e
};