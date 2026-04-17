# Hakari Discord Music Bot

A feature-rich Discord music bot built with modern JavaScript practices and comprehensive error handling.

## Features

- Music playback with Lavalink integration
- Spotify integration
- Queue management
- Voice channel controls
- Comprehensive logging and error handling
- Environment-based configuration

## Installation

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

## Configuration

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

## Commands

- `.play <song>`: Play a song
- `.join`: Join voice channel
- `.leave`: Leave voice channel
- `.queue`: Show queue
- `.skip`: Skip current track
- `.stop`: Stop playback
- `.shuffle`: Shuffle queue
- `.seek <time>`: Seek to time
- `.filter <filter>`: Apply audio filter
- `.clean`: Clean messages

## Logging

The bot uses Winston for comprehensive logging:

- **Console Output:** Colorized logs for development
- **File Logs:** 
  - `logs/error.log`: Error logs
  - `logs/combined.log`: All logs

## Error Handling

The bot includes comprehensive error handling:

- Graceful shutdown on process signals
- Proper cleanup of resources
- Detailed error logging
- Configuration validation

## Development

### Environment Variables

For development, you can set environment variables:

```bash
export NODE_ENV=development
export LOG_LEVEL=debug
```

### Testing

Run tests with:
```bash
npm test
```

## Security

- All sensitive credentials are stored in environment variables
- No hardcoded secrets in code
- Input validation and sanitization
- Secure logging practices

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC License

## Support

For support, please open an issue in the repository.