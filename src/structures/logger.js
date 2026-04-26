// src/structures/logger.js - Simple colored console logger

const moment = require('moment-timezone');
moment.tz.setDefault('Asia/Jakarta');

const DEBUG = process.env.DEBUG === 'true';
const LOG_ERRORS = process.env.LOG_ERRORS !== 'false';

// Colors
const c = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
  orange: '\x1b[38;5;208m',
  purple: '\x1b[38;5;129m',
  reset: '\x1b[0m'
};

function ts() {
  return moment().format('HH:mm');
}

function fmt(label, color, ...args) {
  return `${c.gray}[${ts()}] ${color}[${label}]${c.reset} ${args.join(' ')}`;
}

const logger = {
  error(...args) {
    if (!LOG_ERRORS) return;
    console.error(fmt('ERROR', c.red, ...args));
  },
  
  warn(...args) {
    console.warn(fmt('WARN', c.yellow, ...args));
  },
  
  info(...args) {
    console.log(fmt('INFO', c.green, ...args));
  },
  
  debug(...args) {
    if (!DEBUG) return;
    console.log(fmt('DEBUG', c.magenta, ...args));
  },
  
  commands(...args) {
    console.log(fmt('COMMANDS', c.orange, ...args));
  },
  
  moonlink(...args) {
    if (!DEBUG) return;
    console.log(fmt('MOONLINK', c.purple, ...args));
  },
  
  events(...args) {
    if (!DEBUG) return;
    console.log(fmt('EVENTS', c.cyan, ...args));
  },
  
  player(...args) {
    console.log(fmt('PLAYER', c.green, ...args));
  },
  
  started(...args) {
    console.log(fmt('STARTED', c.blue, ...args));
  },
  
  node(...args) {
    if (!DEBUG) return;
    console.log(fmt('NODE', c.red, ...args));
  }
};

module.exports = logger;