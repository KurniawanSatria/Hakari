const { hakariMessage } = require('../structures/builders');
const { EMOJIS } = require('../structures/emojis');

module.exports = {
  name: 'bassboost',
  aliases: ['bb', 'bass'],
  execute: async (client, message) => {
    try {
      const player = client.manager?.players.get(message.guild.id)

      if (!player || !player.current) {
        return message.reply(hakariMessage('### No Track\nNo track currently playing.'))
      }

      const current = player._bassboost ?? false;
      const newState = !current;

      player._bassboost = newState;

      if (newState) {
        player.filters.setEqualizer([
          { band: 0, gain: 0.3 },
          { band: 1, gain: 0.25 },
          { band: 2, gain: 0.2 },
          { band: 3, gain: 0.15 },
          { band: 4, gain: 0.1 }
        ]);
      } else {
        player.filters.setEqualizer([]);
        player._bassboost = false;
      }

      await player.filters.apply();

      const status = newState ? `${EMOJIS.toggle.on} Enabled` : `${EMOJIS.toggle.off} Disabled`;

      message.reply(
        hakariMessage(`### ${EMOJIS.music_filters.bassboost} BassBoost\nBassboost is now ${status}`)
      );
    } catch (err) {
      message.reply(
        hakariMessage('### Error\nFilter rusak. Bukan lag, ini emang kamu yang maksa 😝')
      );
    }
  }
};