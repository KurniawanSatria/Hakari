const { hakariMessage } = require('../structures/builders');
const logger = require('../structures/logger');
const fs = require('fs');
module.exports = {
    name: 'counter',
    aliases: ['cnt'],
    execute: async (client, message, args) => {
        try {
            if (!args[0]) {
                return message.reply(hakariMessage('### Usage\n`.counter <hero-name>`'));
            }
            const heroName = args[0].toLowerCase();

            // Execute event
            const res = await fetch(`https://mlbb.tools/api/counter?heroSlug=${heroName}&rankTier=all`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            })
            const rus = await fetch(`https://raw.githubusercontent.com/KurniawanSatria/MLBB-HERO-RANK/refs/heads/main/hero.json`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            })
            const rusz = await rus.json();
            const result = await res.json();
            const hero = result.hero
            const roleEmojis = {
                'Fighter': '<:Fighter:1500064042763681863>',
                'Mage': '<:Mage:1500062821268848770>',
                'Marksman': '<:Marksman:1500064044843794432>',
                'Support': '<:Support:1500064047171637248>',
                'Assassin': '<:Assassin:1500064040448294942>',
                'Tank': '<:Tank:1500063855433486387>'
            };
            const laneEmojis = {
                'Jungle': '<:Jungle:1500059254890041436>',
                'Mid Lane': '<:Mid:1500059989887422464>',
                'Roam': '<:Roam:1500059992353673316>',
                'Exp Lane': '<:Exp:1500059994475728957>',
                'Gold Lane': '<:Gold:1500059996463956049>'
            };
            const roles = (hero.roles || []).map(x => `**${roleEmojis[x] || ''} ${x}**`.trim()).join(' / ')
            const lanes = (hero.lanes || []).map(x => `**${laneEmojis[x] || ''} ${x}**`.trim()).join(' / ')
            const img = rusz.find(v => v.name === hero.name)?.img
            const counters = result.counters.map(x => {
                return `**${x.hero_a.name}** ${(x.win_rate * 100).toFixed(2)}%`
            })

            const grid = []
            for (let i = 0; i < counters.length; i += 2) {
                const left = counters[i] || ''
                const right = counters[i + 1] || ''
                grid.push(`${left.padEnd(25, ' ')} ${right}`)
            }

            const counterText = grid.join('\n')
            const payload = {
                "flags": 32768,
                "components": [
                    {
                        "type": 17,
                        "components": [
                            {
                                "type": 9,
                                "components": [
                                    {
                                        "type": 10,
                                        "content": `## ${hero.name}\n- ${roles}\n- ${lanes}`
                                    }
                                ],
                                "accessory": {
                                    "type": 11,
                                    "media": {
                                        "url": hero.avatar_url
                                    }
                                }
                            },
                            {
                                "type": 14
                            },
                            {
                                "type": 12,
                                "items": [
                                    {
                                        "media": {
                                            "url": img
                                        }
                                    }
                                ]
                            },
                            { type: 14 },
                            {
                                "type": 10,
                                "content": `### Countered by:\n${counterText}`
                            }
                        ]
                    }
                ]
            }
            console.log(JSON.stringify(payload, null, 2))

            message.reply(payload)

        } catch (err) {
            message.channel.send(
                hakariMessage(`### ❌ Emit Error\n\`\`\`js\n${err.message}\n\`\`\``)
            );
            logger.error(`Emit error: ${err.message}`);
        }
    }
};
