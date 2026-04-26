const msg = (content) => ({
    flags: 32768,
    components: [{
        type: 17,
        components: [{ type: 10, content }],
    }]
})

module.exports = {
    name: 'shuffle',
    aliases: ['sf'],
    execute: async (client, message) => {
        try {
            const player = client.manager?.players.get(message.guild.id)

            if (!player || !player.queue || player.queue.length === 0) {
                return message.channel.send(msg('### No Queue\nQueue is empty.'))
            }
            player.shuffle();
            message.reply(msg('### Shuffled\nQueue has been shuffled.'))

        } catch (err) {
            message.reply(msg('### Error\nError shuffling queue.'))
        }
    }
}