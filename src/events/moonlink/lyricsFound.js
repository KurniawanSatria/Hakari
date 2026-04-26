const logger = require('../../structures/logger');
const fs = require('fs');

function getLineText(line) {
  if (!line) return '';
  if (typeof line === 'string') return line;
  if (line.segments && Array.isArray(line.segments)) {
    return line.segments.map(s => s.text || '').join('');
  }
  return line.line || line.text || '';
}

function formatTime(ms) {
  if (!ms || ms < 0) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function buildProgressBar(current = 0, total = 0, length = 12) {
  if (!total || total <= 0) return '●───────────────────';
  const filled = Math.round((current / total) * length);
  const empty = length - filled;
  return '▬'.repeat(Math.max(filled - 1, 0)) + '🔘' + '─'.repeat(Math.max(empty, 0));
}

function buildAllLyricsDimmed(lines) {
  if (!lines.length) return '♪';

  const parts = lines.map(line => {
    const t = getLineText(line);
    return t ? `-# ${t}` : null;
  }).filter(Boolean);

  // Tampilkan WINDOW+1 baris pertama (belum ada yang aktif/past di awal)
  const visible = parts.slice(0, 5 + 1);
  const remaining = parts.length - visible.length;

  if (remaining > 0) visible.push(`-# ··· ${remaining}`);

  return visible.join('\n') || '♪';
}

module.exports = {
  name: 'lyricsFound',
  register: (client) => {
    client.manager.on('lyricsFound', async (player, payload) => {
      try {
        if (!player || player.destroyed) return;

        const track = player.current;
        const title = track?.title || 'Unknown';

        fs.writeFileSync('./debug/lyricsFound.json', JSON.stringify(payload, null, 2));

        player.lyricsData = payload;
        player.lyricsLines = payload?.lyrics?.lines || [];
        player.current.lyrics_provider = payload?.lyrics?.provider || 'Unknown';
        player.current.lyrics = payload?.lyrics?.text || '';
        player.HandleByLyrics = true;

        logger.info(`Lyrics Found for ${title} - ${player.lyricsLines.length} lines (${player.guildId})`);
        logger.info(`Found lyrics for ${title} from ${player.current.lyrics_provider}`);

        // Notif pendingLyricsMsg dulu
        if (player.pendingLyricsMsg) {
          const msg = await player.pendingLyricsMsg.edit({
            flags: 32768,
            components: [{
              type: 17,
              components: [
                { type: 10, content: "**<:hakari:1482121759330275400> Hakari Music**" },
                { type: 14, divider: true, spacing: 1 },
                { type: 10, content: `Found lyrics for **${title}** from \`${player.current.lyrics_provider}\`` }
              ],
              accent_color: 16687280
            }]
          });
          setTimeout(() => msg.delete().catch(() => {}), 3000);
        }

        // Edit player.msg tampilkan semua lirik dimmed
        const playerMsg = player.msg;
        if (!playerMsg || !playerMsg.editable) return;

        const thumb = track?.thumbnail || 'https://files.catbox.moe/fnlch5.jpg';
        const titleShort = title.slice(0, 30);
        const duration = formatTime(track?.duration);
        const totalMs = track?.duration ?? 0;

        const queueSize = player.queue?.size ?? player.queue?.length ?? 0;
        const queueText = queueSize > 0 ? `${queueSize} song${queueSize !== 1 ? 's' : ''} in queue` : 'No songs in queue';

        const lyricsDisplay = buildAllLyricsDimmed(player.lyricsLines);
        const progressBar = buildProgressBar(0, totalMs);

        await playerMsg.edit({
          flags: 32768,
          components: [
            {
              type: 17,
              components: [
                {
                  type: 9,
                  components: [
                    {
                      type: 10,
                      content: [
                        `## <a:hakari:1497764150099574904> Now Playing`,
                        `### [${titleShort}](${track.uri})`,
                        `${track.author} — \`${duration}\``,
                      ].join('\n')
                    }
                  ],
                  accessory: {
                    type: 11,
                    media: { url: thumb }
                  }
                },
                { type: 14 },
                {
                  type: 10,
                  content: `## <:lyrics:1451697663396413481> Lyrics\n${lyricsDisplay}`
                },
                { type: 14 },
                {
                  type: 10,
                  content: [
                    `${progressBar} \`[0:00 / ${duration}]\``,
                    `-# ${queueText}`,
                  ].join('\n')
                },
                {
                  type: 1,
                  components: [
                    { style: 4, type: 2, custom_id: 'stop', emoji: { id: '1449501286360944853', name: 'stop' } },
                    { style: 2, type: 2, custom_id: 'previous', emoji: { name: 'previous', id: '1449501284272181309' } },
                    { style: 2, type: 2, custom_id: 'pause_resume', emoji: { name: 'pause', id: '1449501265720774656' } },
                    { style: 2, type: 2, custom_id: 'skip', emoji: { id: '1449501258791518370', name: 'skip' } },
                    { style: 2, type: 2, custom_id: 'queue', emoji: { name: 'queue', id: '1451682061697159310' } }
                  ]
                }
              ]
            }
          ]
        });

      } catch (err) {
        logger.error(`in lyricsFound: ${err.message}`);
      }
    });
  }
};