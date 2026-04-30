const logger = require('../../structures/logger');
const guildDB = require('../../structures/guildDB');
const {
    ContainerBuilder,
    TextDisplayBuilder,
    MediaGalleryBuilder,
    SectionBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    MessageFlags
} = require('discord.js');
const { EMOJIS } = require('../../structures/emojis');

module.exports = {
    name: 'guildCreate',
    execute: async (client, guild) => {
        try {
            logger.info(`Joined a new guild: ${guild.name} (${guild.id})`);

            guildDB.init();

            await new Promise(resolve => setTimeout(resolve, 2000));
            let channel = null;
            

            if (guild.systemChannelId) {
                channel = guild.channels.cache.get(guild.systemChannelId);
            }
            
            if (!channel) {
                channel = guild.channels.cache.find(c => 
                    c.type === 0 && 
                    c.permissionsFor(guild.members.me)?.has('SendMessages')
                );
            }
            
            if (!channel) {
                logger.warn(`No suitable channel found for guild: ${guild.name} (${guild.id})`);
                return;
            }

            const welcomeMessage = {
                flags: MessageFlags.IsComponentsV2,
                components: [
                    new ContainerBuilder()
                        .setAccentColor(0xE7B88B)
                        .addMediaGalleryComponents(gallery =>
                            gallery.addItems(item => item.setURL('https://raw.githubusercontent.com/KurniawanSatria/Hakari/refs/heads/main/assets/banner.png'))
                        )
                        .addTextDisplayComponents(td => 
                            td.setContent("### Thanks for inviting Hakari Music\nLet's get everything ready in a few clicks.")
                        )
                        .addSeparatorComponents(sep => sep.setDivider(true))
                        .addSectionComponents(section =>
                            section
                                .addTextDisplayComponents(td => td.setContent(`## ${EMOJIS.welcome.setup} Quick Setup\n-# Get started in seconds with default configuration.`))
                                .setButtonAccessory(
                                    new ButtonBuilder()
                                        .setCustomId('setup_now')
                                        .setLabel('Start Setup')
                                        .setStyle(ButtonStyle.Primary)
                                )
                        )
                        .addSectionComponents(section =>
                            section
                                .addTextDisplayComponents(td => td.setContent(`## ${EMOJIS.welcome.commands} Commands\n-# Explore all available music commands and features.`))
                                .setButtonAccessory(
                                    new ButtonBuilder()
                                        .setCustomId('show_commands')
                                        .setLabel('View Commands')
                                        .setStyle(ButtonStyle.Success)
                                )
                        )
                ]
            };


            try {
                await channel.send(welcomeMessage);
                logger.info(`Welcome message sent successfully to ${guild.name}`);
            } catch (sendError) {
                logger.error(`Failed to send welcome message in ${guild.name}: ${sendError.message}`);
                try {
                    await channel.send("Thanks for inviting Hakari Music! Use `.help` to see all commands.");
                } catch (fallbackError) {
                    logger.error(`Fallback message also failed: ${fallbackError.message}`);
                }
            }
        } catch (err) {
            logger.error(`Error in guildCreate: ${err.message}`, { stack: err.stack });
        }
    }
};