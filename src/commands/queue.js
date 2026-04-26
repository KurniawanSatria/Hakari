// src/commands/queue.js - Queue command

const { hakariCard, FALLBACK_THUMB } = require('../structures/builders');

function formatDuration(ms) {
  if (!ms || isNaN(ms)) return 'Unknown';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

module.exports = {
  name: 'queue',
  aliases: ['q', 'list'],
  execute: async (client, message, args) => {
    try {
      const player = client.manager?.players.get(message.guild.id);
      if (!player) {
        return message.reply(hakariCard({ content: '### No Player\nNo active player in this server.' }));
      }

      const queue = player.queue.tracks || [];
      const current = player.current;
      if (!current && queue.length === 0) {
        return message.reply(hakariCard({ content: '### Empty Queue\nQueue is empty.', thumbnailURL: FALLBACK_THUMB }));
      }

      const totalDuration = queue.reduce((a, t) => a + (t.duration || 0), 0);

      let desc = current ? `### Now Playing:\n[${current.title}](${current.uri})\n\n` : '';
      desc += '**Up Next:**\n';
      desc += queue.slice(0, 10).map((t, i) => `${i + 1}. [${t.title} - ${t.author}](${t.uri})`).join('\n');
      if (queue.length > 10) desc += `\n... and ${queue.length - 10} more`;

      await message.reply(hakariCard({ content: `### Music Queue\n\n${desc}\n\n-# Total: ${queue.length} tracks`, thumbnailURL: current?.thumbnail }));

    } catch (err) {
      message.reply(hakariCard({ content: '### Error\nError displaying queue.' }));
    }
  }
};
