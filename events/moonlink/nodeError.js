const { log } = require("style-logs");

module.exports = {
    name: "nodeError",
    execute: (client, node, error) => {
        log(`{border: red}Node "${node.identifier || node.name}" encountered an error: ${error.message}.{/}`);
    },
};