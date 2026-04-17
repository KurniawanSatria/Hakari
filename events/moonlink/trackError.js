const { log } = require("style-logs");
module.exports = {
name: "trackException",
execute: async (client, player, track, exception) => {
log(`{border: red}Track "${track.title}" encountered an error: ${exception.message}.{/}`);
},
};
