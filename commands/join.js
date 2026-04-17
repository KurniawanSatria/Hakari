module.exports = {
  name: "join",

  execute: async (client, message, args) => {
    try {
      const channel = message.member.voice.channel;

      if (!channel)
        return await message.reply({ flags: 32768, components: [{type: 17, components: [{type: 10, content: "You must be in a voice channel."}]}] });

      if (!client.manager)
        return await message.reply({ flags: 32768, components: [{type: 17, components: [{type: 10, content: "Music manager is not ready."}]}] });

      const player = client.manager.players.create({
        guildId: message.guild.id,
        voiceChannelId: channel.id,
        textChannelId: message.channel.id,
        deaf: true
      });

      if (player.connected)
        return await message.reply({ flags: 32768, components: [{type: 17, components: [{type: 10, content: "I'm already in a voice channel."}]}] });

      await player.connect();

      await message.reply({ flags: 32768, components: [{type: 17, components: [{type: 10, content: `Joined <#${channel.id}>` }]}] });

    } catch (err) {
      console.error("[JOIN CMD ERROR]:", err);

      await message.reply({ flags: 32768, components: [{type: 17, components: [{type: 10, content: "Failed to join the voice channel."}]}] }).catch(() => {});
    }
  }
};