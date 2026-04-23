// src/structures/logger.js - Logging system

const { createLogger, transports, format } = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');
if (!require('fs').existsSync(logDir)) {
  require('fs').mkdirSync(logDir, { recursive: true });
}

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { service: 'hakari' },
  transports: [
    new transports.DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      level: 'error',
      maxSize: '5m',
      maxFiles: 7
    }),
    new transports.DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      maxSize: '10m',
      maxFiles: 7
    })
  ]
});

// Console output for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }));
}

// Safe logging helpers that won't crash on bad input
const safeLog = {
  info: (...args) => logger.info(...args.map(a => typeof a === 'string' ? a : JSON.stringify(a))),
  warn: (...args) => logger.warn(...args.map(a => typeof a === 'string' ? a : JSON.stringify(a))),
  error: (...args) => {
    const msg = args[0];
    const meta = args[1];
    if (typeof msg === 'string') {
      logger.error(msg, meta);
    } else {
      logger.error(String(msg), meta);
    }
  },
  debug: (...args) => logger.debug(...args.map(a => typeof a === 'string' ? a : JSON.stringify(a)))
};

module.exports = safeLog;