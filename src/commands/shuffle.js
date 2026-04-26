const { hakariMessage } = require('../structures/builders');

module.exports = {
    name: 'shuffle',
    aliases: ['sf'],
    execute: async (client, message) => {
        try {
            const player = client.manager?.players.get(message.guild.id)

            if (!player || !player.queue || player.queue.length === 0) {
                return message.reply(hakariMessage('### No Queue\nQueue is empty.'))
            }
            player.shuffle();
            message.reply(hakariMessage('### Shuffled\nQueue has been shuffled.'))

        } catch (err) {
            message.reply(hakariMessage('### Error\nError shuffling queue.'))
        }
    }
}