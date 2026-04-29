# 🎶 Hakari Discord Music Bot

<img width="1983" height="793" alt="Hakari Icon" src="https://github.com/user-attachments/assets/ba966c51-2174-4b94-beaf-0afca3746b2f" /><br>

**A modern, high-performance Discord music bot powered by MoonLink.js (Lavalink), built with clean architecture, strong error handling, and modular design. Version 2.1.0**

---

## ✨ Features

- 🎵 High-quality music playback via Lavalink/NodeLink
- 🎧 Spotify support (track, album, playlist)
- 📜 Smart queue system (add, remove, shuffle, view)
- 🔊 Voice channel auto-management
- 🔄 Autoplay mode for continuous music
- 🔁 Loop modes (track/queue/off)
- 🎨 9 Audio filters (bassboost, nightcore, vaporwave, karaoke, tremolo, vibrato, rotation/8D, distortion, lowpass)
- 📝 Real-time lyrics display
- 🌐 Multi-language support (English & Indonesian)
- ⚡ Fast response commands with prefix system
- 🧠 Robust error handling & recovery
- 🪵 Advanced logging system (Winston with daily rotation)
- 🔧 Fully environment-based configuration
- 💾 Backup node support for high availability
- 🎵 Now playing cards with musicard integration

---

## 🚀 Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Hakari
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   - Copy the example environment file:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` with your configuration (see Configuration section below)

4. **Start the bot:**
   ```bash
   npm start
   ```

### Development Mode

For development with auto-reload:
```bash
npm run dev
```

---

## ⚙️ Configuration

The bot uses environment variables for configuration. Create a `.env` file based on `.env.example`:

### Required Variables

```env
# Discord Bot Configuration
DISCORD_TOKEN=your-discord-token-here
CLIENT_ID=your-client-id-here

# Spotify API Configuration (Required for default search)
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret

# Lavalink / NodeLink Connection
LAVALINK_HOST=your-lavalink-host
LAVALINK_PORT=2333
LAVALINK_PASSWORD=your-lavalink-password
LAVALINK_SECURE=false
```

### Optional Variables

```env
# Bot Settings
PREFIX=.                          # Command prefix (default: .)
AUTOPLAY=true                     # Auto-play next track (default: true)
CLEAN_TIMEOUT=15000               # Message cleanup timeout in ms (default: 15000)
TWENTY_FOUR_SEVEN=false           # 24/7 voice channel mode (default: false)

# Environment & Logging
NODE_ENV=development              # Environment (development/production)
LOG_LEVEL=info                    # Log level (debug/info/warn/error)
DEBUG=false                       # Debug mode
```

### Backup Nodes (Optional)

You can configure up to 2 backup nodes for high availability:

```env
# Backup Node 1
LAVALINK_HOST_1=backup-host-1
LAVALINK_PORT_1=2333
LAVALINK_PASSWORD_1=backup-password-1
LAVALINK_SECURE_1=false

# Backup Node 2
LAVALINK_HOST_2=backup-host-2
LAVALINK_PORT_2=2333
LAVALINK_PASSWORD_2=backup-password-2
LAVALINK_SECURE_2=false
```

---

## 🎮 Commands

### Music Controls

| Command | Aliases | Description |
|---------|---------|-------------|
| `.play <query/URL>` | `p` | Play a song from search or URL (YouTube, Spotify, etc.) |
| `.pause` | `pause` | Pause the currently playing track |
| `.resume` | `unpause`, `continue` | Resume paused track |
| `.skip` | `s`, `next` | Skip current track (requester skips directly, others vote) |
| `.stop` | `disconnect`, `leave` | Stop playback and clear queue |

### Queue Management

| Command | Aliases | Description |
|---------|---------|-------------|
| `.queue` | `q`, `list` | Display the current song queue |
| `.shuffle` | `mix` | Shuffle the song queue |
| `.loop <mode>` | `repeat` | Set loop mode: `off`, `track`, or `queue` |
| `.autoplay <on/off>` | `ap` | Toggle autoplay mode |

### Audio Filters

| Command | Aliases | Description |
|---------|---------|-------------|
| `.bassboost` | `bb`, `bass` | Toggle bass boost filter |
| `.nightcore` | `nc` | Toggle nightcore filter (faster speed & higher pitch) |
| `.vaporwave` | `vw` | Toggle vaporwave filter (slower speed & lower pitch) |
| `.karaoke` | `kk` | Toggle karaoke filter (vocal removal) |
| `.tremolo` | `trem` | Toggle tremolo filter (volume oscillation) |
| `.vibrato` | `vib` | Toggle vibrato filter (pitch oscillation) |
| `.rotation` | `8d`, `rotate` | Toggle rotation filter (8D audio effect) |
| `.distortion` | `dist` | Toggle distortion filter |
| `.lowpass` | `lp`, `muffle` | Toggle low pass filter (muffle high frequencies) |

### Information & Utilities

| Command | Aliases | Description |
|---------|---------|-------------|
| `.lyrics` | `ly` | Display lyrics of currently playing song |
| `.help [command]` | `h`, `commands` | Show command list or specific command details |
| `.lang [code]` | `language` | Change bot language (`en` or `id`) - Admin only |

---

## 📦 Project Architecture

```
Hakari/
├── src/
│   ├── commands/          # Command modules (20 commands)
│   ├── events/
│   │   ├── client/        # Discord client events
│   │   └── moonlink/      # MoonLink player events
│   └── structures/
│       ├── lang/          # Language files (en, id)
│       ├── builders.js    # Message builders
│       ├── components.js  # UI components
│       ├── config.js      # Configuration management
│       ├── langManager.js # Language system
│       ├── logger.js      # Winston logger setup
│       └── musicard.js    # Now playing cards
├── utils/
│   └── helpers.js         # Utility functions
├── data/                  # Persistent data storage
├── logs/                  # Rotating log files
└── index.js               # Bot entry point
```

### Key Design Patterns

- **Modular command system** - Easy to add new commands
- **Event-driven architecture** - Clean separation of concerns
- **Multi-language support** - Extensible language manager
- **Lavalink-based audio engine** - High-quality streaming via MoonLink.js
- **Stateless command execution** - Reliable and predictable behavior
- **Graceful error recovery** - Auto-reconnect and null-safe validation

---

## 🪵 Logging System

The bot uses Winston for comprehensive logging with daily rotation:

- **Console Output:** Colorized logs for development
- **File Logs:** 
  - `logs/error-YYYY-MM-DD.log`: Error logs
  - `logs/combined-YYYY-MM-DD.log`: All logs
  - `logs/hakari-YYYY-MM-DD.log`: Application-specific logs
- **Auto-cleanup:** Old logs are managed automatically

---

## 🧠 Error Handling

The bot includes comprehensive error handling:

- ✅ Automatic recovery from voice disconnects
- ✅ Safe player destruction and cleanup
- ✅ Queue corruption protection
- ✅ Graceful shutdown handling (SIGINT, SIGTERM)
- ✅ Null-safe state validation throughout
- ✅ Unhandled promise rejection catching
- ✅ Node disconnection/reconnection management
- ✅ Login timeout protection (30s)
- ✅ Backup node failover support

---

## 🛠 Development

### Available NPM Scripts

```bash
# Production
npm start              # Start the bot
npm run cluster        # Start in cluster mode (if available)

# Development
npm run dev            # Start with auto-reload
npm run test           # Run tests
npm run test:watch     # Run tests with watch mode

# Code Quality
npm run lint           # Run ESLint
npm run format         # Format code with Prettier
npm run audit          # Check for security vulnerabilities
```

### Debug Mode

```bash
NODE_ENV=development LOG_LEVEL=debug DEBUG=true npm run dev
```

---

## 🔐 Security

- ✅ No hardcoded secrets - all credentials via environment variables
- ✅ Input validation on all commands
- ✅ Safe logging (no token or password leaks)
- ✅ Controlled Lavalink connection handling
- ✅ `.gitignore` configured to protect sensitive files
- ✅ Environment variable validation on startup

---

## 📋 Requirements

- **Node.js** v16.9.0 or higher
- **Lavalink/NodeLink** server (v4.x recommended)
- **Discord Bot** with proper intents enabled:
  - Guilds
  - GuildMembers
  - GuildMessages
  - MessageContent
  - GuildVoiceStates
- **Spotify API** credentials (for search functionality)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Submit a pull request

---

## 📄 License

ISC License

---

## 🧩 Support

For support, please open an issue in the repository or contact the developer.

**Created by Saturia** - Version 2.1.0