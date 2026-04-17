const config = require("../../config")

module.exports = {
name: "queueEnd",
execute: async (client, player) => {
console.log("Queue ended, checking autoplay...")
const msg = player?.msg
player.msg = null
if (msg?.delete) await msg.delete().catch(()=>{})
player.setAutoPlay(true)
}
}
