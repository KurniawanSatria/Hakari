const { hakariMessage } = require('../structures/builders');

module.exports = {
  name: 'tremolo',
  aliases: ['trem'],
  execute: async (client, message) => {
    try {
      const player = client.manager?.players.get(message.guild.id)

      if (!player || !player.current) {
        return message.reply(hakariMessage('### No Track\nNo track currently playing.'))
      }

      const current = player._tremolo ?? false;
      const newState = !current;

      player._tremolo = newState;

      if (newState) {
        player.filters.setTremolo({
          frequency: 2.0,
          depth: 0.5
        });
      } else {
        player.filters.setTremolo({});
        player._tremolo = false;
      }

      await player.filters.apply();

      const status = newState ? '**enabled**' : '**disabled**';

      message.channel.send(
        hakariMessage(`### <:tremolo:1451682056927973480> Tremolo\nTremolo is now ${status}`)
      );
    } catch (err) {
      message.channel.send(
        hakariMessage('### Error\nFilter rusak. Bukan lag, ini emang kamu yang maksa 😝')
      );
    }
  }
};
