const { hakariMessage } = require('../structures/builders');

module.exports = {
  name: 'loop',
  aliases: ['repeat'],
  execute: async (client, message, args) => {
    try {
      const player = client.manager?.players.get(message.guild.id)

      if (!player || !player.current) {
        return message.reply(hakariMessage('### No Track\nNo track currently playing.'))
      }

      const queueLength = player.queue?.length || 0
      const mode = args[0]?.toLowerCase()

      // kalau ada args → manual override
      if (mode) {
        if (mode === 'off') {
          player.setLoop('none')
          return message.reply(hakariMessage('### Loop Disabled\nLoop has been turned off.'))
        }

        if (mode === 'track') {
          player.setLoop('track')
          return message.reply(hakariMessage('### Loop Track\nCurrent track will repeat.'))
        }

        if (mode === 'queue') {
          player.setLoop('queue')
          return message.reply(hakariMessage('### Loop Queue\nEntire queue will repeat.'))
        }

        return message.reply(hakariMessage('### Invalid Mode\nUse: `off | track | queue`'))
      }

      // tanpa args → auto logic
      if (queueLength <= 1) {
        player.setLoop('track')
        return message.reply(hakariMessage('### Auto Loop\nSwitched to **track loop** (single track detected).'))
      } else {
        player.setLoop('queue')
        return message.reply(hakariMessage('### Auto Loop\nSwitched to **queue loop** (multiple tracks detected).'))
      }

    } catch (err) {
      message.reply(hakariMessage('### Error\nError setting loop.'))
    }
  }
}