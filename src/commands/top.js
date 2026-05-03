const { hakariMessage } = require('../structures/builders');
const logger = require('../structures/logger');
const fs = require('fs');
module.exports = {
    name: 'top',
    aliases: ['tp'],
    execute: async (client, message, args) => {
        try {
            if (!args[0]) {
                return message.reply(hakariMessage('### Usage\n`.top ban/pick/win`'));
            }
            const sort_by = args[0].toLowerCase();
            const reply = (sort_by) => {
                return {
                    "flags": 32768,
                    "components": [
                        {
                            "type": 17,
                            "components": [
                                {
                                    "type": 10,
                                    "content": `## TOP ${sort_by.toUpperCase().replace('RATE', '')} RATE\n-# past 1 days`
                                },
                                {
                                    "type": 14
                                },
                                {
                                    "type": 12,
                                    "items": [
                                        {
                                            "media": {
                                                "url": `https://raw.githubusercontent.com/KurniawanSatria/MLBB-HERO-RANK/main/rank-by-${sort_by}.png`
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            }
            if (sort_by === 'ban') {
                await message.reply(reply('ban'))
            } else if (sort_by === 'pick') {
                await message.reply(reply('pick'))
            } else if (sort_by === 'win') {
                await message.reply(reply('winrate'))
            } else {
                return message.reply(hakariMessage('### Usage\n`.top ban/pick/win`'));
            }

        } catch (err) {
            message.channel.send(
                hakariMessage(`### ❌ Emit Error\n\`\`\`js\n${err.message}\n\`\`\``)
            );
            logger.error(`Emit error: ${err.message}`);
        }
    }
};
