# 🎶 Hakari Discord Music Bot

A modern, high-performance Discord music bot powered by Lavalink, built with clean architecture, strong error handling, and modular design.

---

## ✨ Features

- 🎵 High-quality music playback via Lavalink
- 🎧 Spotify support (track, album, playlist)
- 📜 Smart queue system (add, remove, shuffle, view)
- 🔊 Voice channel auto-management
- 🤖 24/7 mode support
- ⚡ Fast response commands
- 🧠 Robust error handling & recovery
- 🪵 Advanced logging system (Winston)
- 🔧 Fully environment-based configuration

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
   - Edit `.env` with your configuration:
     ```
     DISCORD_TOKEN=your_discord_bot_token_here
     CLIENT_ID=your_client_id_here
     SPOTIFY_CLIENT_ID=your_spotify_client_id_here
     SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
     LAVALINK_HOST=de29.spaceify.eu
     LAVALINK_PORT=25910
     LAVALINK_PASSWORD=youshallnotpass
     LAVALINK_SECURE=false
     PREFIX=.
     AUTOPLAY=true
     CLEAN_TIMEOUT=15000
     TWENTY_FOUR_SEVEN=true
     ```

4. **Set up logging directory:**
   ```bash
   mkdir logs
   ```

5. **Start the bot:**
   ```bash
   npm start
   ```

## ⚙️ Configuration Overview

The bot uses environment variables for configuration. Key settings include:

- **Discord Configuration:**
  - `DISCORD_TOKEN`: Your Discord bot token
  - `CLIENT_ID`: Your Discord application client ID

- **Spotify Configuration:**
  - `SPOTIFY_CLIENT_ID`: Your Spotify API client ID
  - `SPOTIFY_CLIENT_SECRET`: Your Spotify API client secret

- **Lavalink Configuration:**
  - `LAVALINK_HOST`: Lavalink server host
  - `LAVALINK_PORT`: Lavalink server port
  - `LAVALINK_PASSWORD`: Lavalink server password
  - `LAVALINK_SECURE`: Use secure connection (true/false)

- **Bot Settings:**
  - `PREFIX`: Command prefix (default: `.`)
  - `AUTOPLAY`: Auto-play next track (true/false)
  - `CLEAN_TIMEOUT`: Message cleanup timeout in ms
  - `TWENTY_FOUR_SEVEN`: 24/7 mode (true/false)

## 🎮 Commands

- `.play <song>`: Play a song
- `.queue`: Show queue
- `.skip`: Skip current track
- `.stop`: Stop playback
- `.shuffle`: Shuffle queue
- `.pause`: Pause current track
- `.resume`: Resume current track

## 🪵 Logging System

The bot uses Winston for comprehensive logging:

- **Console Output:** Colorized logs for development
- **File Logs:** 
  - `logs/error.log`: Error logs
  - `logs/combined.log`: All logs

## 🧠 Error Handling

The bot includes comprehensive error handling:

- Automatic recovery from voice disconnects
- Safe player destruction
- Queue cleanup protection
- Graceful shutdown handling (SIGINT, SIGTERM)
- Null-safe state validation everywhere

## 🛠 Development

### Dev mode
```bash
NODE_ENV=development LOG_LEVEL=debug npm run dev
```

### Run tests

Run tests with:
```bash
npm test
```

## 🔐 Security

- No hardcoded secrets
- Environment-based credentials
- Input validation on commands
- Safe logging (no token leaks)
- Controlled Lavalink connection handling

# 📦 Project Architecture
- Modular command system
- Event-driven design
- Separated structures (logger, builders, handlers)
- Lavalink-based audio engine
- Stateless command execution

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

ISC License

## 🧩 Support

For support, please open an issue in the repository.