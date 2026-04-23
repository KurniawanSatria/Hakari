// src/commands/stop.js - Stop command

const { errorMsg, successMsg } = require('../structures/components');

module.exports = {
  name: 'stop',
  aliases: ['leave', 'disconnect'],
  execute: async (client, message, args) => {
    try {
      const player = client.manager?.players.get(message.guild.id);
      if (!player) {
        return message.channel.send(errorMsg('No Player', 'No active player in this server.'));
      }
      
      const queueSize = player.queue.size;
      player.queue.clear();
      await player.destroy();
      
      message.channel.send(successMsg(`⏹ Stopped and cleared queue (\`${queueSize}\` tracks).`));
      
    } catch (err) {
      message.channel.send(errorMsg('Error', 'Error stopping.'));
    }
  }
};