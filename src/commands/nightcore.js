const { hakariMessage } = require('../structures/builders');

module.exports = {
  name: 'nightcore',
  aliases: ['nc'],
  execute: async (client, message) => {
    try {
      const player = client.manager?.players.get(message.guild.id)

      if (!player || !player.current) {
        return message.reply(hakariMessage('### No Track\nNo track currently playing.'))
      }

      const current = player._nightcore ?? false;
      const newState = !current;

      player._nightcore = newState;

      if (newState) {
        player.filters.setTimescale({
          speed: 1.3,
          pitch: 1.3,
          rate: 1.0
        });
      } else {
        player.filters.clear();
      }

      await player.filters.apply();

      const status = newState ? '**enabled**' : '**disabled**';

      message.channel.send(
        hakariMessage(`### <:nightcore:1451682056927973477> Nightcore\nNightcore is now ${status}`)
      );
    } catch (err) {
      message.channel.send(
        hakariMessage('### Error\nFilter rusak. Bukan lag, ini emang kamu yang maksa 😝')
      );
    }
  }
};
