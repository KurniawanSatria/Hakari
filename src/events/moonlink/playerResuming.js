module.exports = {
    name: 'playerUpdate',
    register: (client) => {
        client.manager.on('playerResuming', async (player) => {
            console.log(`Player resumed: ${player.guildId}`);
            console.log(Object.keys(player))
        })
    }
}