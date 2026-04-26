const logger = require('../structures/logger');
const config = require('../structures/config');

module.exports = {
  name: 'help',
  aliases: ['h'],
  execute: async (client, message, args) => {
    try {
      const commands = [
        { name: 'play', aliases: ['p'], description: 'Memutar musik dari query atau URL' },
        { name: 'pause', aliases: [], description: 'Menjeda musik yang sedang diputar' },
        { name: 'resume', aliases: [], description: 'Melanjutkan musik yang dijeda' },
        { name: 'stop', aliases: [], description: 'Menghentikan pemutaran dan membersihkan antrian' },
        { name: 'skip', aliases: ['s'], description: 'Melewati lagu saat ini' },
        { name: 'queue', aliases: ['q'], description: 'Menampilkan antrian lagu' },
        { name: 'loop', aliases: ['l'], description: 'Mengatur mode loop (off/track/queue)' },
        { name: 'shuffle', aliases: [], description: 'Mengacak antrian lagu' },
        { name: 'autoplay', aliases: [], description: 'Mengatur mode autoplay' },
        { name: 'lyrics', aliases: ['ly'], description: 'Menampilkan lirik lagu yang sedang diputar' }
      ];

      const embed = {
        author: {
          name: '🎵 Hakari Music Bot',
          icon_url: client.user.displayAvatarURL({ dynamic: true })
        },
        title: '📋 Daftar Perintah',
        description: 'Berikut adalah semua perintah yang tersedia untuk bot musik Hakari:',
        color: 16687280,
        fields: commands.map(cmd => ({
          name: `\`${cmd.name}${cmd.aliases.length > 0 ? ` (${cmd.aliases.join(', ')})` : ''}\``,
          value: cmd.description,
          inline: false
        })),
        footer: {
          text: 'Gunakan .help [nama perintah] untuk informasi lebih detail',
          icon_url: 'https://cdn-icons-png.flaticon.com/512/2108/2108689.png'
        }
      };

      const row = {
        type: 1,
        components: [
          {
            type: 2,
            style: 1,
            label: '🎵 Musik',
            custom_id: 'help_music',
            emoji: { name: 'musical_note', id: '1482113385486352586' }
          },
          {
            type: 2,
            style: 1,
            label: '🎚️ Kontrol',
            custom_id: 'help_control',
            emoji: { name: 'sliders', id: '1451682056927973476' }
          },
          {
            type: 2,
            style: 1,
            label: '🔧 Lainnya',
            custom_id: 'help_other',
            emoji: { name: 'settings', id: '1451682056927973476' }
          }
        ]
      };

      await message.channel.send({
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
              "content": "<:hakari:1482121759330275400> **Hakari Music**\n\n"
            }
          ],
          "accessory": {
            "type": 11,
            "media": {
              "url": "https://i.pinimg.com/736x/0b/10/35/0b103568ea4ff4be76d73c44102e697e.jpg"
            }
          }
        },
        {
          "type": 14
        },
        {
          "type": 10,
          "content": `## <:icons8command100:1497903456067780698> Daftar Perintah\n-# Berikut adalah semua perintah yang tersedia untuk bot musik Hakari:\n${commands.map(cmd => `- \`.${cmd.name}\`\n  - ${cmd.description}\n`,).join('\n')}`
        },
        {
          "type": 12,
          "items": [
            {
              "media": {
                "url": "https://i.ibb.co.com/F4kMkZj4/hakari-1.gif"
              }
            }
          ]
        }
      ],
      "accent_color": 15176859,
      "spoiler": false
    }
  ]
});

    } catch (err) {
      logger.error(`Help: ${err.message}`);
      message.channel.send('Terjadi kesalahan saat menampilkan bantuan.');
    }
  }
};