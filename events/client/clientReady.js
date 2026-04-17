// events/client/ready.js
const { ActivityType } = require("discord.js")
const { log } = require("style-logs");
module.exports = {
name: "clientReady",
/**
 * Sets the client's presence to "online" with a streaming activity showing the total number of users in all guilds.
 * @param {Client} client The Discord.js client instance
 */
execute: (client) => {
  const totalGuildUsers = client.guilds.cache.reduce((total, guild) => total + guild.memberCount, 0);
  client.user.setPresence({
    activities: [{
      name: `${totalGuildUsers} users`,
      type: ActivityType.Streaming,
      url: "https://twitch.tv/whatever"
    }],
    status: "online"
  });
},
};