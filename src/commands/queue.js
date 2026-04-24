// src/commands/queue.js - Queue command

const { ACCENT_COLOR, FALLBACK_THUMB } = require('../structures/components');

function formatDuration(ms) {
  if (!ms || isNaN(ms)) return 'Unknown';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const msg = (content, thumb) => ({
  flags: 32768,
  components: [{
    type: 17,
    components: [
      { type: 9, components: [{ type: 10, content }], accessory: { type: 11, media: { url: thumb || FALLBACK_THUMB }, description: 'Album thumbnail' } }
    ],
    accent_color: ACCENT_COLOR
  }]
});

module.exports = {
  name: 'queue',
  aliases: ['q', 'list'],
  execute: async (client, message, args) => {
    try {
      const player = client.manager?.players.get(message.guild.id);
      if (!player) {
        return message.channel.send(msg('### No Player\nNo active player in this server.'));
      }

      const queue = player.queue.tracks || [];
      const current = player.current;
      if (!current && queue.length === 0) {
        return message.channel.send(msg('### Empty Queue\nQueue is empty.', FALLBACK_THUMB));
      }

      const totalDuration = queue.reduce((a, t) => a + (t.duration || 0), 0);

      let desc = current ? `### Now Playing:\n[${current.title}](${current.uri})\n\n` : '';
      desc += '**Up Next:**\n';
      desc += queue.slice(0, 10).map((t, i) => `${i + 1}. [${t.title} - ${t.author}](${t.uri})`).join('\n');
      if (queue.length > 10) desc += `\n... and ${queue.length - 10} more`;

      await message.channel.send(msg(`### Music Queue\n\n${desc}\n\n-# Total: ${queue.length} tracks`, current?.thumbnail));

    } catch (err) {
      message.channel.send(msg('### Error\nError displaying queue.'));
    }
  }
};