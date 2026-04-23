// src/commands/autoplay.js - Toggle autoplay

const { successMsg, errorMsg } = require('../structures/components');

module.exports = {
  name: 'autoplay',
  aliases: ['ap', 'autoplaylist'],
  execute: async (client, message, args) => {
    try {
      const player = client.manager?.players.get(message.guild.id);

      // Toggle or show status
      let newState;

      if (args[0]) {
        // Set explicit state
        const arg = args[0].toLowerCase();
        if (arg === 'on' || arg === 'true' || arg === '1') {
          newState = true;
        } else if (arg === 'off' || arg === 'false' || arg === '0') {
          newState = false;
        } else {
          return message.channel.send(errorMsg('Invalid Option', 'Use `.autoplay on` or `.autoplay off`'));
        }
      } else {
        // Toggle current
        newState = !player?.autoPlay;
      }

      if (player) {
        player.setAutoPlay(newState);
        const emoji = newState ? '<:toggleon:1488148374208119036>' : '<:toggleoff:1488148371905577020>';
        const status = newState ? '**enabled**' : '**disabled**';

        message.channel.send({
          "flags": 32768,
          "components": [
            {
              "type": 17,
              "components": [
                {
                  "type": 10,
                  "content": `### ${emoji} AutoPlay`
                },
                {
                  "type": 14
                },
                {
                  "type": 10,
                  "content": `Autoplay is now ${status}`
                }
              ],
            }
          ]
        });
      } else {
        // Show current bot default
        const config = require('../structures/config');
        const defaultState = config.autoplay;
        message.channel.send({
          "flags": 32768,
          "components": [
            {
              "type": 17,
              "components": [
                {
                  "type": 10,
                  "content": `### <:autoplay:1451682056927973476> AutoPlay`
                },
                {
                  "type": 14
                },
                {
                  "type": 10,
                  "content": `Default autoplay: ${defaultState ? '**enabled**' : '**disabled**'}\n\nUse \`.autoplay on/off\` when a player is active.`
                }
              ],
            }
          ]
        })
      }

    } catch (err) {
      message.channel.send(errorMsg('Error', 'Error toggling autoplay.'));
    }
  }
};