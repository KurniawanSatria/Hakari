module.exports = {
  name: "skip",
  aliases: ["s", "next"],
/**
 * Skips the current track and goes to the next one in the queue.
 * If there is no track in the queue, the player will be stopped.
 * @param {Client} client - The client instance.
 * @param {Message} message - The message instance that triggered the command.
 * @param {Array<string>} args - The array of arguments passed to the command.
 */
  execute: async (client, message, args) => {
    try {
      const player = client.manager.players.get(message.guild.id);
      if (!player) {
        return await message.reply({flags: 32768, components: [{type: 17, components: [{type: 10, content: "No active player!"}]}]});
      }
      if (!message.member.voice.channel) {
        return await message.reply({flags: 32768, components: [{type: 17, components: [{type: 10, content: "You must be in a voice channel!"}]}]});
      }
      if (!player.playing) {
        return await message.reply({flags: 32768, components: [{type: 17, components: [{type: 10, content: "Nothing is playing!"}]}]});
      }

      const skipped = player.current?.title ?? "Unknown";
      player.skip();
      await message.reply({flags: 32768, components: [{type: 17, components: [{type: 10, content: `<:icons8fastforward100:1477753804656218202> Skipped **${skipped}**.`}]}]});
    } catch (error) {
      console.error("[SKIP CMD] Error:", error);

      await message.reply({
        flags: 32768,
        components: [
          {
            type: 17,
            components: [
              {
                type: 10,
                content: "An error occurred while skipping the track."
              }
            ]
          }
        ]
      }).catch(() => {});
    }
  }
};
