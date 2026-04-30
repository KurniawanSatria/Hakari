// src/commands/autoplay.js - Toggle autoplay

const guildDB = require('../structures/guildDB');
const { hakariMessage } = require('../structures/builders');
const { EMOJIS } = require('../structures/emojis');

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
        else return message.channel.send(hakariMessage('### Invalid Option\nUse `.autoplay on` or `.autoplay off`'));
      } else {
        const guildSettings = guildDB.getGuild(message.guild.id);
        newState = !guildSettings.autoplay;
      }

      guildDB.setGuildSetting(message.guild.id, 'autoplay', newState);
      
      if (player) {
        player.setAutoPlay(newState);
      }
      
      const status = newState ? `${EMOJIS.toggle.on} Enabled` : `${EMOJIS.toggle.off} Disabled`;
      message.channel.send(hakariMessage(`### ${EMOJIS.music_filters.autoplay} AutoPlay\nAutoplay is now ${status}`));

    } catch (err) {
      message.channel.send(hakariMessage('### Error\nError toggling autoplay.'));
    }
  }
};