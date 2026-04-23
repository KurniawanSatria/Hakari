// src/events/moonlink/playerEvents.js - Player and Node debugging

const logger = require('../../structures/logger');

module.exports = {
  name: 'playerEvents',
  register: (client) => {
    // Node events
    client.manager.on('nodeReady', (node) => {
      logger.moonlink(`Node Ready: ${node.identifier}`);
    });

    client.manager.on('nodeError', (node, error) => {
      logger.error(`Node Error: ${node.identifier} - ${error.message}`);
    });

    client.manager.on('nodeConnect', (node) => {
      logger.moonlink(`Node Connected: ${node.identifier}`);
    });

    client.manager.on('nodeDisconnect', (node, reason) => {
      logger.warn(`Node Disconnected: ${node.identifier} - ${reason}`);
    });

    // Player lifecycle
    client.manager.on('playerCreate', (player) => {
      logger.player(`Created: ${player.guildId}`);
    });

    client.manager.on('playerDestroy', (player, reason) => {
      logger.player(`Destroyed: ${player.guildId} (${reason})`);
    });

    client.manager.on('playerConnected', (player) => {
      logger.player(`Connected: ${player.guildId}`);
    });

    client.manager.on('playerDisconnected', (player) => {
      logger.player(`Disconnected: ${player.guildId}`);
      
      if (player && !player.destroyed) {
        player.destroy('voice disconnected');
      }
    });

    client.manager.on('playerMuteChange', (player, selfMute, serverMute) => {
      logger.debug(`Mute: ${player.guildId} (self: ${selfMute}, server: ${serverMute})`);
    });

    client.manager.on('playerDeafChange', (player, selfDeaf, serverDeaf) => {
      logger.debug(`Deaf: ${player.guildId} (self: ${selfDeaf}, server: ${serverDeaf})`);
    });

    client.manager.on('playerSuppressChange', (player, suppress) => {
      logger.debug(`Suppress: ${player.guildId} (${suppress})`);
    });

    client.manager.on('playerChangedVolume', (player, oldVol, newVol) => {
      logger.debug(`Volume: ${player.guildId} ${oldVol} → ${newVol}`);
    });

    client.manager.on('playerChangedLoop', (player, oldLoop, newLoop) => {
      logger.player(`Loop: ${player.guildId} ${oldLoop} → ${newLoop}`);
    });
  }
};