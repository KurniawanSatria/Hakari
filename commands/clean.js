module.exports = {
    name: "clean",
    aliases: ["cleanmode"],
    description: "Toggle clean mode (auto-delete commands & bot messages) for this guild",
    /**
     * Toggles clean mode for this guild.
     * When enabled, all command invocations and bot responses are auto-deleted after a short delay.
     * @param {Client} client
     * @param {Message} message
     * @param {string[]} args
     */
    async execute(client, message, args) {
        try {
            if (!message.guild) {
                return await message.reply({ content: "This command can only be used in a server." });
            }

            const guildId = message.guild.id;
            const wasEnabled = client.cleanMode.get(guildId) ?? false;
            client.cleanMode.set(guildId, !wasEnabled);

            await message.reply({
                flags: 32768,
                components: [{
                    type: 17,
                    components: [{
                        type: 10,
                        content: `Clean mode **${!wasEnabled ? "enabled ✅" : "disabled ❌"}**. Bot messages will ${!wasEnabled ? "now" : "no longer"} be automatically deleted after a short delay.`
                    }]
                }]
            });
        } catch (error) {
            console.error("[CLEAN CMD] Error:", error);
            await message.reply({
                flags: 32768,
                components: [{ type: 17, components: [{ type: 10, content: "An error occurred while toggling clean mode." }] }]
            }).catch(() => {});
        }
    },
};