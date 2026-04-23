// src/events/moonlink/playerEvents.js - Player debugging

const logger = require('../../structures/logger');

module.exports = {
  name: 'playerEvents',
  register: (client) => {
    // Player lifecycle
    client.manager.on('playerCreate', (player) => {
      logger.info(`[player] Created: ${player.guildId}`);
    });

    client.manager.on('playerDestroy', (player, reason) => {
      logger.info(`[player] Destroyed: ${player.guildId} (${reason})`);
    });

    client.manager.on('playerConnected', (player) => {
      logger.info(`[player] Connected: ${player.guildId}`);
    });

    client.manager.on('playerDisconnected', (player) => {
      logger.info(`[player] Disconnected: ${player.guildId}`);
      
      // Auto-destroy after disconnect
      if (player && !player.destroyed) {
        player.destroy('voice disconnected');
      }
    });

    // Voice state
    client.manager.on('playerMuteChange', (player, selfMute, serverMute) => {
      logger.debug(`[player] Mute: ${player.guildId} (self: ${selfMute}, server: ${serverMute})`);
    });

    client.manager.on('playerDeafChange', (player, selfDeaf, serverDeaf) => {
      logger.debug(`[player] Deaf: ${player.guildId} (self: ${selfDeaf}, server: ${serverDeaf})`);
    });

    client.manager.on('playerSuppressChange', (player, suppress) => {
      logger.debug(`[player] Suppress: ${player.guildId} (${suppress})`);
    });

    // Volume
    client.manager.on('playerChangedVolume', (player, oldVol, newVol) => {
      logger.debug(`[player] Volume: ${player.guildId} ${oldVol} → ${newVol}`);
    });

    // Loop
    client.manager.on('playerChangedLoop', (player, oldLoop, newLoop) => {
      logger.info(`[player] Loop: ${player.guildId} ${oldLoop} → ${newLoop}`);
    });
  }
};