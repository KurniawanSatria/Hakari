const logger = require('../../structures/logger');
const fs = require('fs');


const WINDOW = 5;

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

function buildLyricsDisplay(lines, currentIdx, lineText) {
  if (currentIdx >= 0 && lines.length > 0) {
    const start = Math.max(0, currentIdx - WINDOW);
    const end = Math.min(lines.length, currentIdx + WINDOW + 1);

    const parts = lines.slice(start, end).map((line, i) => {
      const realIdx = start + i;
      const t = getLineText(line);
      if (!t) return null;

      if (realIdx < currentIdx) return `-# ~~${t}~~`;
      if (realIdx === currentIdx) return `**__${t}__**`;
      return `-# ${t}`;
    }).filter(Boolean);

    const prefix = start > 0 ? `-# ··· ${start} lines earlier\n` : '';
    const suffix = end < lines.length ? `\n-# ··· ${lines.length - end} lines later` : '';

    return prefix + parts.join('\n') + suffix || '♪';
  }

  return lineText || '♪';
}

module.exports = {
  name: 'lyricsLine',
  register: (client) => {
    client.manager.on('lyricsLine', async (player, payload) => {
      try {
        if (!player || player.destroyed) return;
        if (!player.playing && !player.paused) return;

        player.HandleByLyrics = true;

        const track = player.current;
        const msg = player.msg;
        if (!msg || !msg.editable) return;

        const thumb = track?.thumbnail || 'https://files.catbox.moe/fnlch5.jpg';
        const title = track?.title.slice(0, 30) || 'Unknown';
        const duration = formatTime(track?.duration);

        const queueSize = player.queue?.size ?? player.queue?.length ?? 0;
        const queueText = queueSize > 0 ? `${queueSize} song${queueSize !== 1 ? 's' : ''} in queue` : 'No songs in queue';

        const lineData = payload?.line;
        const lineTime = lineData?.timestamp;
        const lineText = lineData?.line || '';
        const lines = player.lyricsLines || [];

        let currentIdx = -1;
        if (payload?.lineIndex !== undefined) {
          currentIdx = payload.lineIndex;
        } else if (lineTime !== undefined && lines.length > 0) {
          currentIdx = lines.findIndex(l =>
            l.timestamp <= lineTime && (l.timestamp + l.duration >= lineTime)
          );
        }

        fs.writeFileSync('./debug/lyricsLine.json', JSON.stringify(payload, null, 2));

        const lyricsDisplay = buildLyricsDisplay(lines, currentIdx, lineText);
        const currentMs = lineTime ?? player.position ?? 0;
        const totalMs = track?.duration ?? 0;

        const progressBar = buildProgressBar(currentMs, totalMs);
        const currentTime = formatTime(currentMs);

        await msg.edit({
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
                        `### [${title}](${track.uri})`,
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
                    `${progressBar} \`[${currentTime} / ${duration}]\``,
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
        logger.error(`in lyricsLine:${err.message}`);
      }
    });
  }
};