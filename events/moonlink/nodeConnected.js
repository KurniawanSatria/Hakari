const { log } = require("style-logs");
module.exports = {
    name: "nodeConnected",
    execute: (client, node) => {
        log(`{border: green}Node "${node.identifier || node.name}" connected.{/}`);
    },
};