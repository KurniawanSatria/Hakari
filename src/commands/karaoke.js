const { hakariMessage } = require('../structures/builders');

module.exports = {
  name: 'karaoke',
  aliases: ['kk'],
  execute: async (client, message) => {
    try {
      const player = client.manager?.players.get(message.guild.id)

      if (!player || !player.current) {
        return message.reply(hakariMessage('### No Track\nNo track currently playing.'))
      }

      const current = player._karaoke ?? false;
      const newState = !current;

      player._karaoke = newState;

      if (newState) {
        player.filters.setKaraoke({
          level: 1.0,
          monoLevel: 1.0,
          filterBand: 220,
          filterWidth: 100
        });
      } else {
        player.filters.setKaraoke({});
        player._karaoke = false;
      }

      await player.filters.apply();

      const status = newState ? '**enabled**' : '**disabled**';

      message.channel.send(
        hakariMessage(`### <:karaoke:1451682056927973479> Karaoke\nKaraoke is now ${status}`)
      );
    } catch (err) {
      message.channel.send(
        hakariMessage('### Error\nFilter rusak. Bukan lag, ini emang kamu yang maksa 😝')
      );
    }
  }
};
