const { hakariMessage } = require('../structures/builders');

module.exports = {
  name: 'vaporwave',
  aliases: ['vw'],
  execute: async (client, message) => {
    try {
      const player = client.manager?.players.get(message.guild.id)

      if (!player || !player.current) {
        return message.reply(hakariMessage('### No Track\nNo track currently playing.'))
      }

      const current = player._vaporwave ?? false;
      const newState = !current;

      player._vaporwave = newState;

      if (newState) {
        player.filters.setTimescale({
          speed: 0.85,
          pitch: 0.8,
          rate: 1.0
        });
      } else {
        player.filters.clear();
      }

      await player.filters.apply();

      const status = newState ? '**enabled**' : '**disabled**';

      message.channel.send(
        hakariMessage(`### <:vaporwave:1451682056927973478> Vaporwave\nVaporwave is now ${status}`)
      );
    } catch (err) {
      message.channel.send(
        hakariMessage('### Error\nFilter rusak. Bukan lag, ini emang kamu yang maksa 😝')
      );
    }
  }
};
