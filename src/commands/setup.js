const guildDB = require('../structures/guildDB');
const { hakariCard, hakariMessage } = require('../structures/builders');
const { EMOJIS } = require('../structures/emojis');
const { ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'setup',
  aliases: ['channel', 'channels'],
  execute: async (client, message, args) => {
    try {
      const action = args[0]?.toLowerCase();
      const guildSettings = guildDB.getGuild(message.guild.id);

      if (!action || action === 'view') {
        const announceChannel = guildSettings.announceChannelId 
          ? `<#${guildSettings.announceChannelId}>` 
          : '`Not set`';
        const requestChannel = guildSettings.requestChannelId 
          ? `<#${guildSettings.requestChannelId}>` 
          : '`Not set`';

        return message.reply(hakariCard({
          content: `### ${EMOJIS.ui.settings} Channel Setup\n\n**Announce Channel:** ${announceChannel}\n**Request Channel:** ${requestChannel}\n\n-# Use \`.setup announce\` or \`.setup request\` to configure`,
          thumbnailURL: message.guild.iconURL() || 'https://files.catbox.moe/fnlch5.jpg'
        }));
      }

      if (action === 'announce' || action === 'announcechannel') {
        let channelId = guildSettings.announceChannelId;

        if (!channelId) {
          const existingChannel = message.guild.channels.cache.find(
            c => c.name === 'hakari-announcements' && c.type === ChannelType.GuildText
          );

          if (existingChannel) {
            channelId = existingChannel.id;
          } else {
            try {
              const newChannel = await message.guild.channels.create({
                name: 'hakari-announcements',
                type: ChannelType.GuildText,
                permissionOverwrites: [
                  {
                    id: message.guild.roles.everyone.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
                    deny: [PermissionFlagsBits.SendMessages]
                  },
                  {
                    id: client.user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.ReadMessageHistory]
                  }
                ],
                reason: 'Hakari music bot announce channel'
              });

              channelId = newChannel.id;
            } catch (err) {
              return message.reply(hakariMessage('### Error\nFailed to create announce channel. Please check permissions.'));
            }
          }

          guildDB.setGuildSetting(message.guild.id, 'announceChannelId', channelId);
        } else {
          const channel = message.guild.channels.cache.get(channelId);
          if (!channel) {
            guildDB.setGuildSetting(message.guild.id, 'announceChannelId', null);
            return message.reply(hakariMessage('### Channel Not Found\nThe announce channel no longer exists. Creating new one...'));
          }
        }

        return message.reply(hakariCard({
          content: `### ${EMOJIS.ui.success} Announce Channel Set\n\nNow playing messages will be sent to <#${channelId}>`,
          thumbnailURL: message.guild.iconURL() || 'https://files.catbox.moe/fnlch5.jpg'
        }));
      }

      if (action === 'request' || action === 'requestchannel') {
        let channelId = guildSettings.requestChannelId;

        if (!channelId) {
          const existingChannel = message.guild.channels.cache.find(
            c => c.name === 'hakari-requests' && c.type === ChannelType.GuildText
          );

          if (existingChannel) {
            channelId = existingChannel.id;
          } else {
            try {
              const newChannel = await message.guild.channels.create({
                name: 'hakari-requests',
                type: ChannelType.GuildText,
                permissionOverwrites: [
                  {
                    id: message.guild.roles.everyone.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                    deny: []
                  },
                  {
                    id: client.user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages]
                  }
                ],
                reason: 'Hakari music bot request channel'
              });

              channelId = newChannel.id;
            } catch (err) {
              return message.reply(hakariMessage('### Error\nFailed to create request channel. Please check permissions.'));
            }
          }

          guildDB.setGuildSetting(message.guild.id, 'requestChannelId', channelId);
        } else {
          const channel = message.guild.channels.cache.get(channelId);
          if (!channel) {
            guildDB.setGuildSetting(message.guild.id, 'requestChannelId', null);
            return message.reply(hakariMessage('### Channel Not Found\nThe request channel no longer exists. Creating new one...'));
          }
        }

        return message.reply(hakariCard({
          content: `### ${EMOJIS.ui.success} Request Channel Set\n\nMusic requests should be made in <#${channelId}>`,
          thumbnailURL: message.guild.iconURL() || 'https://files.catbox.moe/fnlch5.jpg'
        }));
      }

      if (action === 'reset') {
        guildDB.setGuildSetting(message.guild.id, 'announceChannelId', null);
        guildDB.setGuildSetting(message.guild.id, 'requestChannelId', null);
        return message.reply(hakariMessage('### Channels Reset\n\nChannel settings have been reset.'));
      }

      return message.reply(hakariMessage('### Usage\n\n`.setup` - View channels\n`.setup announce` - Set announce channel\n`.setup request` - Set request channel\n`.setup reset` - Reset channels'));

    } catch (err) {
      message.reply(hakariMessage('### Error\nFailed to setup channels.'));
    }
  }
};
