// src/events/client/interactionCreate.js - Button interactions

const logger = require('../../structures/logger');

module.exports = {
  name: 'interactionCreate',
  execute: async (client, interaction) => {
    try {
      // Only handle buttons
      if (!interaction.isButton()) return;
      
      if (!client.manager) {
        return interaction.reply({ 
          content: 'Music not initialized.', 
          ephemeral: true 
        });
      }
      
      const player = client.manager.players.get(interaction.guildId);
      if (!player) {
        return interaction.reply({ 
          content: 'No active player.', 
          ephemeral: true 
        });
      }
      
      const { customId } = interaction;
      
      switch (customId) {
        case 'stop':
          player.queue.clear();
          await player.destroy();
          await interaction.reply({ 
            content: '⏹ Stopped and disconnected.', 
            ephemeral: true 
          });
          break;
          
        case 'skip':
          const title = player.current?.title || 'track';
          player.skip();
          await interaction.reply({ 
            content: `⏭ Skipped **${title}**.`, 
            ephemeral: true 
          });
          break;
          
        default:
          logger.warn(`Unknown button: ${customId}`);
      }
      
    } catch (err) {
      logger.error(`[interaction] ${err.message}`);
      if (!interaction.replied) {
        interaction.reply({ 
          content: 'Error processing interaction.', 
          ephemeral: true 
        }).catch(() => {});
      }
    }
  }
};