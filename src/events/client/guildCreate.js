const logger = require('../../structures/logger');
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

module.exports = {
    name: 'guildCreate',
    execute: async (client, guild) => {
        try {
            logger.info(`Joined a new guild: ${guild.name} (${guild.id})`);

            // Wait a bit for guild to be fully ready
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Find a suitable channel
            let channel = null;
            
            // Try system channel first
            if (guild.systemChannelId) {
                channel = guild.channels.cache.get(guild.systemChannelId);
            }
            
            // If no system channel, find a text channel
            if (!channel) {
                channel = guild.channels.cache.find(c => 
                    c.type === 0 && // GuildText
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
                                .addTextDisplayComponents(td => td.setContent('## ⚡ Quick Setup\n-# Get started in seconds with default configuration.'))
                                .setButtonAccessory(
                                    new ButtonBuilder()
                                        .setCustomId('setup_now')
                                        .setLabel('Start Setup')
                                        .setStyle(ButtonStyle.Primary)
                                )
                        )
                        .addSectionComponents(section =>
                            section
                                .addTextDisplayComponents(td => td.setContent('## 📖 Commands\n-# Explore all available music commands and features.'))
                                .setButtonAccessory(
                                    new ButtonBuilder()
                                        .setCustomId('show_commands')
                                        .setLabel('View Commands')
                                        .setStyle(ButtonStyle.Success)
                                )
                        )
                        .addSectionComponents(section =>
                            section
                                .addTextDisplayComponents(td => td.setContent('## 🌐 Settings\n-# Configure language and command prefix to match your server.'))
                                .setButtonAccessory(
                                    new ButtonBuilder()
                                        .setCustomId('show_lang_prefix')
                                        .setLabel('Open Settings')
                                        .setStyle(ButtonStyle.Success)
                                )
                        )
                        .addMediaGalleryComponents(gallery =>
                            gallery.addItems(item => item.setURL('https://i.ibb.co.com/Zztkcpbj/hakari.gif'))
                        )
                ]
            };

            // Send welcome message
            try {
                await channel.send(welcomeMessage);
                logger.info(`Welcome message sent successfully to ${guild.name}`);
            } catch (sendError) {
                logger.error(`Failed to send welcome message in ${guild.name}: ${sendError.message}`);
                // Try sending a simple text message as fallback
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