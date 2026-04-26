const msg = (content) => ({
  flags: 32768,
  components: [{
    type: 17,
    components: [{ type: 10, content }],
  }]
})

module.exports = {
  name: 'resume',
  aliases: ['rs'],
  execute: async (client, message) => {
    try {
      const player = client.manager?.players.get(message.guild.id)

      if (!player || !player.current) {
        return message.channel.send(msg('### No Track\nNo track currently playing.'))
      }

      if (!player.paused) {
        return message.reply(msg('### Not Paused\nTrack is already playing.'))
      }

      player.pause(false)

      message.reply(msg('### Resumed\nPlayback has been resumed.'))

    } catch (err) {
      message.reply(msg('### Error\nError resuming track.'))
    }
  }
}