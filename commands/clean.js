module.exports = {
    name: "clean",
    aliases: ["cleanmode"],
    description: "Toggle clean mode (auto-delete commands & bot messages) for this guild",
/**
 * Toggles clean mode (auto-delete commands & bot messages) for this guild.
 * Clean mode causes all command invocations and bot messages to be automatically deleted after a short delay.
 * @param {Client} client The Discord.js client instance.
 * @param {Message} message The message invoking this command.
 * @param {string[]} args The arguments passed to this command.
 */
    async execute(client, message, args) {
        try {
            if (!message.guild) {
                return await message.reply({ content: "This command can only be used in a server." });
            }
            const guildId = message.guild.id;

            await message.reply({ content: `Clean mode **${!wasEnabled ? "enabled" : "disabled"}**. All command invocations and bot messages will now be automatically deleted after a short delay.` });
        } catch (error) {
            console.error("[CLEAN CMD] Error:", error);

            await message.reply({ content: "An error occurred while toggling clean mode." }).catch(() => { });
        }
    },
};