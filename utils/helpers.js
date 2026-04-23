// utils/helpers.js

const logger = require('../logging');

/**
 * Sanitize error message for user-facing responses
 * @param {Error|string} error - The error to sanitize
 * @returns {string} - Safe error message for users
 */
function sanitizeError(error) {
    if (!error) return "An unknown error occurred";
    const message = typeof error === 'string' ? error : error.message;
    const sensitivePatterns = [
        /password/i, /token/i, /secret/i, /key/i, /credential/i,
        /auth/i, /bearer/i, /basic/i, /api[_-]?key/i
    ];
    for (const pattern of sensitivePatterns) {
        if (pattern.test(message)) {
            return "An error occurred. Please check the bot logs for details.";
        }
    }
    return "An error occurred. Please try again later.";
}

/**
 * Log error with proper error level
 * @param {string} context - Where the error occurred
 * @param {Error} error - The error object
 */
function logError(context, error) {
    logger.error(`[${context}] ${error.message}`, {
        stack: error.stack,
        cause: error.cause
    });
}

/**
 * Format milliseconds to human-readable duration
 * @param {number} ms - Duration in milliseconds
 * @returns {string} - Formatted duration (H:MM:SS or M:SS)
 */
function formatDuration(ms) {
    if (!ms || isNaN(ms)) return "Unknown";
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Retry utility with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @returns {Promise<any>} - Result of the function
 */
async function withRetry(fn, { maxRetries = 3, baseDelay = 1000, maxDelay = 10000 } = {}) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (attempt === maxRetries) break;
            const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastError;
}

/**
 * Safe reply to message with error handling
 * @param {Message} message - Discord message to reply to
 * @param {Object} options - Reply options
 */
async function safeReply(message, options) {
    try {
        return await message.reply(options);
    } catch (err) {
        logError('safeReply', err);
    }
}

module.exports = {
    sanitizeError,
    logError,
    formatDuration,
    withRetry,
    safeReply,
    logger
};