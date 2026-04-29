module.exports = {
  help: {
    title: 'Command List',
    subtitle: 'Here are all available commands for the Hakari music bot:',
    footer: 'Use `.help [command name]` for more details',
    commandNotFound: 'Command `{cmd}` not found. Use `.help` to see the command list.',
    detailTitle: 'Command Detail',
    detailDescription: 'Description',
    detailAliases: 'Aliases',
    detailUsage: 'Usage',
    detailPermission: 'Permission',
    error: 'An error occurred while displaying help.',
    commands: {
      play: {
        description: 'Play music from a query or URL',
        usage: '.play <query or URL>',
        permission: 'Requires voice channel'
      },
      pause: {
        description: 'Pause the currently playing music',
        usage: '.pause',
        permission: 'Requires voice channel, requester only'
      },
      resume: {
        description: 'Resume paused music',
        usage: '.resume',
        permission: 'Requires voice channel, requester only'
      },
      stop: {
        description: 'Stop playback and clear the queue',
        usage: '.stop',
        permission: 'Requires voice channel, requester only'
      },
      skip: {
        description: 'Skip the current song',
        usage: '.skip',
        permission: 'Requires voice channel, requester skips directly, others vote'
      },
      queue: {
        description: 'Display the song queue',
        usage: '.queue',
        permission: 'Requires voice channel (read-only)'
      },
      loop: {
        description: 'Set loop mode (off/track/queue)',
        usage: '.loop <off/track/queue>',
        permission: 'Requires voice channel, requester only'
      },
      shuffle: {
        description: 'Shuffle the song queue',
        usage: '.shuffle',
        permission: 'Requires voice channel, requester only'
      },
      autoplay: {
        description: 'Toggle autoplay mode',
        usage: '.autoplay <on/off>',
        permission: 'Requires voice channel, requester only'
      },
      lyrics: {
        description: 'Display lyrics of the currently playing song',
        usage: '.lyrics',
        permission: 'Requires voice channel (read-only)'
      },
      help: {
        description: 'Show command list or details of a specific command',
        usage: '.help [command name]',
        permission: 'Available anywhere'
      },
      lang: {
        description: 'Change the bot language for this server',
        usage: '.lang [language code]',
        permission: 'Admin only (Manage Guild)'
      },
      bassboost: {
        description: 'Toggle bass boost audio filter',
        usage: '.bassboost',
        permission: 'Requires voice channel'
      },
      nightcore: {
        description: 'Toggle nightcore audio filter (faster & higher pitch)',
        usage: '.nightcore',
        permission: 'Requires voice channel'
      },
      vaporwave: {
        description: 'Toggle vaporwave audio filter (slower & lower pitch)',
        usage: '.vaporwave',
        permission: 'Requires voice channel'
      },
      karaoke: {
        description: 'Toggle karaoke filter (vocal removal)',
        usage: '.karaoke',
        permission: 'Requires voice channel'
      },
      tremolo: {
        description: 'Toggle tremolo filter (volume oscillation)',
        usage: '.tremolo',
        permission: 'Requires voice channel'
      },
      vibrato: {
        description: 'Toggle vibrato filter (pitch oscillation)',
        usage: '.vibrato',
        permission: 'Requires voice channel'
      },
      rotation: {
        description: 'Toggle rotation filter (8D audio effect)',
        usage: '.rotation',
        permission: 'Requires voice channel'
      },
      distortion: {
        description: 'Toggle distortion audio filter',
        usage: '.distortion',
        permission: 'Requires voice channel'
      },
      lowpass: {
        description: 'Toggle low pass filter (muffle high frequencies)',
        usage: '.lowpass',
        permission: 'Requires voice channel'
      }
    }
  },
  lang: {
    current: 'Current language: **{lang}**',
    changed: 'Language changed to **{lang}**',
    available: 'Available languages: {list}',
    invalid: 'Invalid language. Available languages: {list}',
    noPermission: 'Only admins can change the server language.'
  }
};
