module.exports = {
  help: {
    title: 'Daftar Perintah',
    subtitle: 'Berikut adalah semua perintah yang tersedia untuk bot musik Hakari:',
    footer: 'Gunakan `.help [nama perintah]` untuk informasi lebih detail',
    commandNotFound: 'Perintah `{cmd}` tidak ditemukan. Gunakan `.help` untuk melihat daftar perintah.',
    detailTitle: 'Detail Perintah',
    detailDescription: 'Deskripsi',
    detailAliases: 'Alias',
    detailUsage: 'Penggunaan',
    detailPermission: 'Izin',
    error: 'Terjadi kesalahan saat menampilkan bantuan.',
    commands: {
      play: {
        description: 'Memutar musik dari query atau URL',
        usage: '.play <query atau URL>',
        permission: 'Membutuhkan voice channel'
      },
      pause: {
        description: 'Menjeda musik yang sedang diputar',
        usage: '.pause',
        permission: 'Membutuhkan voice channel, hanya requester'
      },
      resume: {
        description: 'Melanjutkan musik yang dijeda',
        usage: '.resume',
        permission: 'Membutuhkan voice channel, hanya requester'
      },
      stop: {
        description: 'Menghentikan pemutaran dan membersihkan antrian',
        usage: '.stop',
        permission: 'Membutuhkan voice channel, hanya requester'
      },
      skip: {
        description: 'Melewati lagu saat ini',
        usage: '.skip',
        permission: 'Membutuhkan voice channel, requester langsung skip, lainnya vote'
      },
      queue: {
        description: 'Menampilkan antrian lagu',
        usage: '.queue',
        permission: 'Membutuhkan voice channel (read-only)'
      },
      loop: {
        description: 'Mengatur mode loop (off/track/queue)',
        usage: '.loop <off/track/queue>',
        permission: 'Membutuhkan voice channel, hanya requester'
      },
      shuffle: {
        description: 'Mengacak antrian lagu',
        usage: '.shuffle',
        permission: 'Membutuhkan voice channel, hanya requester'
      },
      autoplay: {
        description: 'Mengatur mode autoplay',
        usage: '.autoplay <on/off>',
        permission: 'Membutuhkan voice channel, hanya requester'
      },
      lyrics: {
        description: 'Menampilkan lirik lagu yang sedang diputar',
        usage: '.lyrics',
        permission: 'Membutuhkan voice channel (read-only)'
      },
      help: {
        description: 'Menampilkan daftar perintah atau detail perintah tertentu',
        usage: '.help [nama perintah]',
        permission: 'Tersedia di mana saja'
      },
      lang: {
        description: 'Mengubah bahasa bot untuk server ini',
        usage: '.lang [kode bahasa]',
        permission: 'Hanya admin (Manage Guild)'
      }
    }
  },
  lang: {
    current: 'Bahasa saat ini: **{lang}**',
    changed: 'Bahasa diubah ke **{lang}**',
    available: 'Bahasa tersedia: {list}',
    invalid: 'Bahasa tidak valid. Bahasa tersedia: {list}',
    noPermission: 'Hanya admin yang dapat mengubah bahasa server.'
  }
};
