// events/client/raw.js

const { GatewayDispatchEvents } = require("discord.js");

module.exports = {
    name: "raw",
    execute: (client, d) => {
        if (
            ![
                GatewayDispatchEvents.VoiceStateUpdate,
                GatewayDispatchEvents.VoiceServerUpdate,
            ].includes(d.t)
        )
            return;

        client.manager.packetUpdate?.(d);
    },
};