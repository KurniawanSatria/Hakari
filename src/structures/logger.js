// src/structures/logger.js - Simple colored console logger

const util = require('util');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone')
moment.tz.setDefault('Asia/Jakarta');

// Log configuration
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  sources: 3,
  started: 3,
  network: 3
};

const currentLevel = (process.env.LOG_LEVEL || 'info').toLowerCase();
const currentLogLevel = LOG_LEVELS[currentLevel] ?? 2;

// Plain colors (no bold/italic)
const colors = {
  INFO: '\x1b[32m',      // green
  WARN: '\x1b[33m',      // yellow
  ERROR: '\x1b[31m',     // red
  DEBUG: '\x1b[35m',     // magenta
  
  COMMANDS: '\x1b[38;5;208m', // orange
  MOONLINK: '\x1b[38;5;129m', // purple
  EVENTS: '\x1b[38;5;81m',  // cyan
  WATCHER: '\x1b[38;5;227m', // bright yellow
  PLAYER: '\x1b[32m',   // green
  STARTED: '\x1b[34m',   // blue
  
  reset: '\x1b[0m'
};

// Get color
function getColor(label) {
  return colors[label] || colors.INFO;
}

// Log file setup
let logStream = null;
const logDir = path.join(__dirname, '../../logs');

function initLogStream() {
  if (logStream) return;
  
  try {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const today = new Date().toISOString().slice(0, 10);
    const logFile = path.join(logDir, `hakari-${today}.log`);
    logStream = fs.createWriteStream(logFile, { flags: 'a' });
  } catch (err) {
    console.error('Failed to create log file:', err.message);
  }
}

// Main logger function
function logger(label, ...args) {
  // If first arg is not a known level/category, treat it as message
  const knownLabels = Object.keys(colors);
  if (!knownLabels.includes(label)) {
    args = [label, ...args];
    label = 'INFO';
  }
  
  const levelIndex = LOG_LEVELS[label.toLowerCase()];
  if (levelIndex === undefined || levelIndex < currentLogLevel) return;
  
  // Get color
  const color = getColor(label);
  
  // Format timestamp (HH:mm:ss)
  const time = '[ \x1b[1;37m' + moment().format('HH:mm:ss') + '\x1b[0m ]';
  
  // Format message args
  const formattedArgs = args.map((arg) => {
    if (arg instanceof Error) {
      return arg.stack || arg.message;
    }
    if (typeof arg === 'object' && arg !== null) {
      return util.inspect(arg, { depth: null, colors: false });
    }
    return String(arg);
  });
  
  const msg = util.format(...formattedArgs);
  
  // Console output
  console.log(`${time} ${color}[ ${label} ]${colors.reset} ${msg}`);
  
  // Write to file (no colors)
  if (logStream) {
    logStream.write(`[${new Date().toISOString()}] [${label}] ${msg}\n`);
  }
}

// Shortcut methods
logger.info = (...args) => logger('INFO', ...args);
logger.warn = (...args) => logger('WARN', ...args);
logger.error = (...args) => logger('ERROR', ...args);
logger.debug = (...args) => logger('DEBUG', ...args);

// Named loggers
logger.commands = (...args) => logger('COMMANDS', ...args);
logger.moonlink = (...args) => logger('MOONLINK', ...args);
logger.events = (...args) => logger('EVENTS', ...args);
logger.watcher = (...args) => logger('WATCHER', ...args);
logger.player = (...args) => logger('PLAYER', ...args);
logger.started = (...args) => logger('STARTED', ...args);

// Initialize log file
initLogStream();

module.exports = logger;