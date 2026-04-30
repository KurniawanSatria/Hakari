const logger = require('../../structures/logger');
const guildDB = require('../../structures/guildDB');

module.exports = {
    name: 'guildDelete',
    execute: async (client, guild) => {
        try {
            logger.info(`Removed from guild: ${guild.name || 'Unknown'} (${guild.id})`);

            const player = client.manager?.players.get(guild.id);
            if (player) {
                player.destroy('Guild removed');
            }

            guildDB.deleteGuild(guild.id);
            
            logger.info(`Guild data cleaned up for ${guild.id}`);
        } catch (err) {
            logger.error(`Error in guildDelete: ${err.message}`, { stack: err.stack });
        }
    }
};
