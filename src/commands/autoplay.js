// src/commands/autoplay.js - Toggle autoplay

const { ACCENT_COLOR } = require('../structures/components');

const msg = (content) => ({
  flags: 32768,
  components: [{
    type: 17,
    components: [
      { type: 10, content: content.split('\n')[0] },
      { type: 14 },
      { type: 10, content: content.split('\n').slice(1).join('\n') }
    ],
    accent_color: ACCENT_COLOR
  }]
});

module.exports = {
  name: 'autoplay',
  aliases: ['ap', 'autoplaylist'],
  execute: async (client, message, args) => {
    try {
      const player = client.manager?.players.get(message.guild.id);

      let newState;
      if (args[0]) {
        const arg = args[0].toLowerCase();
        if (arg === 'on' || arg === 'true' || arg === '1') newState = true;
        else if (arg === 'off' || arg === 'false' || arg === '0') newState = false;
        else return message.channel.send(msg('### Invalid Option\nUse `.autoplay on` or `.autoplay off`'));
      } else {
        newState = !player?.autoPlay;
      }

      if (player) {
        player.setAutoPlay(newState);
        const status = newState ? '**enabled**' : '**disabled**';
        message.channel.send(msg(`### <:autoplay:1451682056927973476> AutoPlay\nAutoplay is now ${status}`));
      } else {
        const config = require('../structures/config');
        const defaultState = config.autoplay;
        message.channel.send(msg(`### <:autoplay:1451682056927973476> AutoPlay\nDefault autoplay: ${defaultState ? '**enabled**' : '**disabled**'}\n\nUse \`.autoplay on/off\` when a player is active.`));
      }

    } catch (err) {
      message.channel.send(msg('### Error\nError toggling autoplay.'));
    }
  }
};