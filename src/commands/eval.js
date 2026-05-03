const { hakariMessage } = require('../structures/builders');
const logger = require('../structures/logger');

module.exports = {
  name: 'eval',
  aliases: ['ev', 'execute'],
  ownerOnly: true,
  execute: async (client, message, args) => {
    try {
      // Check if user is owner
      const ownerId = process.env.OWNER_ID;
      if (!ownerId || message.author.id !== ownerId) {
        return message.reply(hakariMessage('### ❌ Access Denied\nOnly bot owner can use this command.'));
      }

      if (!args[0]) {
        return message.reply(hakariMessage('### Usage\n`.eval <code>` - Execute JavaScript code'));
      }
      let player = client.manager?.players.get(message.guild.id)

      const code = args.join(' ');
      let evaled;
      evaled = eval(code);
      if (evaled instanceof Promise) {
        evaled = await evaled;
      }
      const result = (String(evaled));
      const output = result.length > 1900 ? result.substring(0, 1900) + '...' : result;
      await message.channel.send(hakariMessage(`### Eval Result\n\`\`\`js\n${output}\n\`\`\``));

      logger.info(`Eval executed by ${message.author.tag}: ${code.substring(0, 100)}`);
    } catch (err) {
      message.channel.send(
        hakariMessage(`### ❌ Eval Error\n\`\`\`js\n${err.message}\n\`\`\``)
      );
      logger.error(`Eval error: ${err.message}`);
    }
  }
};
