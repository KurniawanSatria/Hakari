// src/commands/stop.js - Stop command

const { ACCENT_COLOR } = require('../structures/components');

const errorMsg = (title, desc) => ({
  flags: 32768,
  components: [{
    type: 17,
    components: [{ type: 10, content: `### ${title}\n${desc}` }],
    accent_color: ACCENT_COLOR
  }]
});

module.exports = {
  name: 'stop',
  aliases: ['leave', 'disconnect'],
  execute: async (client, message, args) => {
    try {
      const player = client.manager?.players.get(message.guild.id);
      if (!player) {
        return message.channel.send(errorMsg('No Player', 'No active player in this server.'));
      }
      await message.delete().catch(() => {});
      if (player.lyricsMsg) {
        player.lyricsMsg.delete().catch(() => {});
        player.lyricsMsg = null;
      }
      player.lyricsData = null;
      player.lyricsLines = null;

      if (player.msg?.delete) {
        player.msg.delete().catch(() => {});
      }
      player.msg = null;

      player.queue.clear();
      await player.destroy();

    } catch (err) {
      message.channel.send(errorMsg('Error', 'Error stopping.'));
    }
  }
};