const { hakariMessage } = require('../structures/builders');
const { EMOJIS } = require('../structures/emojis');

module.exports = {
  name: 'distortion',
  aliases: ['dist'],
  execute: async (client, message) => {
    try {
      const player = client.manager?.players.get(message.guild.id)

      if (!player || !player.current) {
        return message.reply(hakariMessage('### No Track\nNo track currently playing.'))
      }

      const current = player._distortion ?? false;
      const newState = !current;

      player._distortion = newState;

      if (newState) {
        player.filters.setDistortion({
          sinOffset: 0,
          sinScale: 1,
          cosOffset: 0,
          cosScale: 1,
          tanOffset: 0,
          tanScale: 1,
          offset: 0,
          scale: 1
        });
      } else {
        player.filters.setDistortion({});
        player._distortion = false;
      }

      await player.filters.apply();

      const status = newState ? `${EMOJIS.toggle.on} Enabled` : `${EMOJIS.toggle.off} Disabled`;

      message.reply(
        hakariMessage(`### ${EMOJIS.music_filters.distortion} Distortion\nDistortion is now ${status}`)
      );
    } catch (err) {
      message.reply(
        hakariMessage('### Error\nFilter rusak. Bukan lag, ini emang kamu yang maksa 😝')
      );
    }
  }
};
