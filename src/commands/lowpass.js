const { hakariMessage } = require('../structures/builders');

module.exports = {
  name: 'lowpass',
  aliases: ['lp', 'muffle'],
  execute: async (client, message) => {
    try {
      const player = client.manager?.players.get(message.guild.id)

      if (!player || !player.current) {
        return message.reply(hakariMessage('### No Track\nNo track currently playing.'))
      }

      const current = player._lowpass ?? false;
      const newState = !current;

      player._lowpass = newState;

      if (newState) {
        player.filters.setLowPass({
          smoothing: 20
        });
      } else {
        player.filters.clear();
      }

      await player.filters.apply();

      const status = newState ? '**enabled**' : '**disabled**';

      message.channel.send(
        hakariMessage(`### <:lowpass:1451682056927973483> Low Pass\nLow Pass is now ${status}`)
      );
    } catch (err) {
      message.channel.send(
        hakariMessage('### Error\nFilter rusak. Bukan lag, ini emang kamu yang maksa 😝')
      );
    }
  }
};
