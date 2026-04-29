const { hakariMessage } = require('../structures/builders');

module.exports = {
  name: 'rotation',
  aliases: ['8d', 'rotate'],
  execute: async (client, message) => {
    try {
      const player = client.manager?.players.get(message.guild.id)

      if (!player || !player.current) {
        return message.reply(hakariMessage('### No Track\nNo track currently playing.'))
      }

      const current = player._rotation ?? false;
      const newState = !current;

      player._rotation = newState;

      if (newState) {
        player.filters.setRotation({
          rotationHz: 0.2
        });
      } else {
        player.filters.setRotation({});
        player._rotation = false;
      }

      await player.filters.apply();

      const status = newState ? '**enabled**' : '**disabled**';

      message.channel.send(
        hakariMessage(`### <:rotation:1451682056927973482> Rotation (8D)\nRotation is now ${status}`)
      );
    } catch (err) {
      message.channel.send(
        hakariMessage('### Error\nFilter rusak. Bukan lag, ini emang kamu yang maksa 😝')
      );
    }
  }
};
