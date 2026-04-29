const { hakariMessage } = require('../structures/builders');

module.exports = {
  name: 'vibrato',
  aliases: ['vib'],
  execute: async (client, message) => {
    try {
      const player = client.manager?.players.get(message.guild.id)

      if (!player || !player.current) {
        return message.reply(hakariMessage('### No Track\nNo track currently playing.'))
      }

      const current = player._vibrato ?? false;
      const newState = !current;

      player._vibrato = newState;

      if (newState) {
        player.filters.setVibrato({
          frequency: 2.0,
          depth: 0.5
        });
      } else {
        player.filters.setVibrato({});
        player._vibrato = false;
      }

      await player.filters.apply();

      const status = newState ? '**enabled**' : '**disabled**';

      message.channel.send(
        hakariMessage(`### <:vibrato:1451682056927973481> Vibrato\nVibrato is now ${status}`)
      );
    } catch (err) {
      message.channel.send(
        hakariMessage('### Error\nFilter rusak. Bukan lag, ini emang kamu yang maksa 😝')
      );
    }
  }
};
