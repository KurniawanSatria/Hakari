// src/commands/skip.js - Skip command

const { ACCENT_COLOR } = require('../structures/components');

const msg = (content) => ({
  flags: 32768,
  components: [{
    type: 17,
    components: [{ type: 10, content }],
    accent_color: ACCENT_COLOR
  }]
});

module.exports = {
  name: 'skip',
  aliases: ['s', 'next'],
  execute: async (client, message, args) => {
    try {
      const player = client.manager?.players.get(message.guild.id);
      if (!player || !player.current) {
        return message.channel.send(msg('### No Track\nNo track currently playing.'));
      }

      const title = player.current.title;
      player.skip();

      message.channel.send(msg(`### Skipped\n**${title}**`));

    } catch (err) {
      message.channel.send(msg('### Error\nError skipping track.'));
    }
  }
};