const msg = (content) => ({
  flags: 32768,
  components: [{
    type: 17,
    components: [{ type: 10, content }],
  }]
})

module.exports = {
  name: 'pause',
  aliases: ['ps'],
  execute: async (client, message) => {
    try {
      const player = client.manager?.players.get(message.guild.id)

      if (!player || !player.current) {
        return message.channel.send(msg('### No Track\nNo track currently playing.'))
      }

      if (player.paused) {
        return message.reply(msg('### Already Paused\nTrack is already paused.'))
      }

      player.pause(true)

      message.reply(msg('### Paused\nPlayback has been paused.'))

    } catch (err) {
      message.reply(msg('### Error\nError pausing track.'))
    }
  }
}