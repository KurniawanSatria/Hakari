const { hakariMessage } = require('../structures/builders');
const logger = require('../structures/logger');

module.exports = {
  name: 'emit',
  aliases: ['trigger', 'fire'],
  ownerOnly: true,
  execute: async (client, message, args) => {
    try {
      // Check if user is owner
      const ownerId = process.env.OWNER_ID;
      if (!ownerId || message.author.id !== ownerId) {
        return message.reply(hakariMessage('### ❌ Access Denied\nOnly bot owner can use this command.'));
      }

      if (!args[0]) {
        return message.reply(hakariMessage('### Usage\n`.emit <event-name> [data]` - Emit Discord/MoonLink events\n\n**Examples:**\n`.emit ready`\n`.emit guildCreate test`\n`.emit trackStart {guildId: "123"}`'));
      }

      const eventName = args[0].toLowerCase();
      const eventData = args.slice(1).join(' ');

      // Available events to emit
      const availableEvents = {
        // Client events
        'ready': () => {
          client.emit('ready', client);
          return 'Ready event emitted';
        },
        'guildcreate': async () => {
          const guild = message.guild;
          client.emit('guildCreate', guild);
          return `GuildCreate event emitted for ${guild.name}`;
        },
        'guilddelete': async () => {
          const guild = message.guild;
          client.emit('guildDelete', guild);
          return `GuildDelete event emitted for ${guild.name}`;
        },
        
        // MoonLink events
        'trackstart': async () => {
          const player = client.manager?.players.get(message.guild.id);
          if (!player || !player.current) {
            return 'No active player or track found';
          }
          client.manager.emit('trackStart', player, player.current);
          return `TrackStart event emitted for ${player.current.title}`;
        },
        'trackend': async () => {
          const player = client.manager?.players.get(message.guild.id);
          if (!player) {
            return 'No active player found';
          }
          client.manager.emit('trackEnd', player, player.current || {});
          return 'TrackEnd event emitted';
        },
        'queueend': async () => {
          const player = client.manager?.players.get(message.guild.id);
          if (!player) {
            return 'No active player found';
          }
          client.manager.emit('queueEnd', player, player.queue.tracks || []);
          return 'QueueEnd event emitted';
        },
        'playerupdate': async () => {
          const player = client.manager?.players.get(message.guild.id);
          if (!player) {
            return 'No active player found';
          }
          client.manager.emit('playerUpdate', player);
          return 'PlayerUpdate event emitted';
        },
        'nodeconnected': () => {
          const node = client.manager?.nodes?.first();
          if (!node) {
            return 'No node found';
          }
          client.manager.emit('nodeConnected', node);
          return `NodeConnected event emitted for ${node.identifier}`;
        },
        'nodeerror': () => {
          const node = client.manager?.nodes?.first();
          if (!node) {
            return 'No node found';
          }
          const error = new Error('Test error emitted by owner');
          client.manager.emit('nodeError', node, error);
          return `NodeError event emitted for ${node.identifier}`;
        },

        // Custom eval mode
        'custom': async () => {
          if (!eventData) {
            return 'Custom mode requires event data. Format: `.emit custom {event: "name", data: {...}}`';
          }
          const parsed = JSON.parse(eventData);
          if (!parsed.event) {
            return 'Event name required in JSON data';
          }
          client.manager.emit(parsed.event, parsed.data || {});
          return `Custom event "${parsed.event}" emitted`;
        }
      };

      // Execute event
      const handler = availableEvents[eventName];
      if (!handler) {
        const eventList = Object.keys(availableEvents).join(', ');
        return message.reply(
          hakariMessage(`### Available Events\n${eventList}\n\nUse \`.emit custom\` for custom events`)
        );
      }

      const result = await handler();
      message.channel.send(hakariMessage(`### ✅ Event Emitted\n${result}`));
      logger.info(`Event "${eventName}" emitted by ${message.author.tag}`);

    } catch (err) {
      message.channel.send(
        hakariMessage(`### ❌ Emit Error\n\`\`\`js\n${err.message}\n\`\`\``)
      );
      logger.error(`Emit error: ${err.message}`);
    }
  }
};
