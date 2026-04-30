const EMOJIS = {
  music: {
    play: '<:play:1449501274520682546>',
    pause: '<:pause:1449501265720774656>',
    resume: '<:play:1449501274520682546>',
    stop: '<:stop:1449501286360944853>',
    skip: '<:skip:1449501258791518370>',
    previous: '<:previous:1449501284272181309>',
    queue: '<:queue:1451682061697159310>',
    shuffle: '<:shuffle:1449501282233667595>',
    loop: '<:loop:1449501270426787951>',
    autoplay: '<:autoplay:1449501263564984370>',
  },
  navigation: {
    left: '<:left:1498024952849498385>',
    right: '<:right:1465814301787820178>',
  },
  bot: {
    hakari: '<:hakari:1482121759330275400>',
    hakariAnimated: '<a:hakari:1497764150099574904>',
  },
  ui: {
    command: '<:icons8command100:1497903456067780698>',
    settings: '<:settings:1497903048423374859>',
    info: '<:info:1476619350927741131>',
    warning: '<:warning:1476619352748064818>',
    error: '<:error:1476619354706542766>',
    success: '<:success:1476619345680400534>',
  },
  music_filters: {
    bassboost: '<:filter:1451683859845615697>',
    nightcore: '<:filter:1451683859845615697>',
    vaporwave: '<:filter:1451683859845615697>',
    karaoke: '<:filter:1451683859845615697>',
    tremolo: '<:filter:1451683859845615697>',
    vibrato: '<:filter:1451683859845615697>',
    rotation: '<:filter:1451683859845615697>',
    distortion: '<:filter:1451683859845615697>',
    lowpass: '<:filter:1451683859845615697>',
    autoplay: '<:autoplay:1449501263564984370>',
  },
  platforms: {
    spotify: '<:spy:1481718391847915631>',
    youtube: '<:yt:1481718394075222248>',
    soundcloud: '<:sc:1481718389226602506>',
  },
  queue:{
    add: '<:addtoqueue:1499216747956408350>',
    playlist: '<:playlist:1499217239063269406>',
  },
  lyrics: {
    musicalnote: '<:musicalnote:1482113385486352586>',
    lyrics: '<:lyrics:1482110308435628153>',
  },
  progressbar: {
    dot: '<:dot:1498023441649897503>',
  },
  emotions: {
    sad: '<a:sad:1498882453883060294>',
  },
  toggle: {
    on: '<:toggleon:1488148374208119036>',
    off: '<:toggleoff:1488148371905577020>',
  },
  help_sections: {
    playback: '<:musicalnote:1482113385486352586>',
    filters: '<:filter:1451683859845615697>',
    utility: '<:setup:1498931952886218803>',
    owner: '<:lock:1498933004800753735>',
  },
  welcome: {
    setup: '<:setup:1498931952886218803>',
    commands: '<:docs:1498931948998103042>',
    settings: '<:settings:1497903048423374859>',
    playing: '<:musicalnote:1482113385486352586>',
  },
};

function getEmoji(category, name) {
  if (EMOJIS[category] && EMOJIS[category][name]) {
    return EMOJIS[category][name];
  }
  return '';
}

function getAllEmojis() {
  return EMOJIS;
}

function getEmojiByCustomId(customId) {
  const emojiMap = {
    'stop': EMOJIS.music.stop,
    'previous': EMOJIS.music.previous,
    'pause_resume': EMOJIS.music.pause,
    'skip': EMOJIS.music.skip,
    'queue': EMOJIS.music.queue,
  };
  return emojiMap[customId] || '';
}

module.exports = {
  EMOJIS,
  getEmoji,
  getAllEmojis,
  getEmojiByCustomId,
};
