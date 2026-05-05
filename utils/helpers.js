// utils/helpers.js - Error handling and utility functions

const logger = require('../src/structures/logger');

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

/**
 * Safely get channel with validation
 * @param {Client} client - Discord client
 * @param {string} channelId - Channel ID
 * @returns {Channel|null} - Channel or null
 */
function getSafeChannel(client, channelId) {
    try {
        if (!client || !channelId) return null;
        return client.channels?.cache.get(channelId) || null;
    } catch (err) {
        logger.debug(`getSafeChannel: ${err.message}`);
        return null;
    }
}

/**
 * Safely get guild with validation
 * @param {Client} client - Discord client
 * @param {string} guildId - Guild ID
 * @returns {Guild|null} - Guild or null
 */
function getSafeGuild(client, guildId) {
    try {
        if (!client || !guildId) return null;
        return client.guilds?.cache.get(guildId) || null;
    } catch (err) {
        logger.debug(`getSafeGuild: ${err.message}`);
        return null;
    }
}

/**
 * Check if bot has required permissions in a channel
 * @param {Channel} channel - Discord channel
 * @param {Client} client - Discord client
 * @param {Array<string>} permissions - Required permissions
 * @returns {boolean} - Whether bot has all permissions
 */
function hasRequiredPermissions(channel, client, permissions = ['Connect', 'Speak', 'ViewChannel']) {
    try {
        if (!channel || !client?.user) return false;
        const perms = channel.permissionsFor(client.user);
        if (!perms) return false;
        return permissions.every(perm => perms.has(perm));
    } catch (err) {
        logger.debug(`hasRequiredPermissions: ${err.message}`);
        return false;
    }
}

/**
 * Safely destroy a player with cleanup
 * @param {Player} player - MoonLink player
 * @param {string} reason - Reason for destruction
 */
async function safeDestroyPlayer(player, reason = 'cleanup') {
    try {
        if (!player || player.destroyed) {
            logger.debug(`safeDestroyPlayer: Player already destroyed or null`);
            return;
        }

        logger.info(`safeDestroyPlayer: Destroying player in guild ${player.guildId} - Reason: ${reason}`);

        // Clean up track message
        const playerMsg = global.db.data.guilds[player.guildId].message;
        if (playerMsg?.id && playerMsg?.channelId) {
          const oldChannel = client.channels?.cache.get(playerMsg.channelId);
          if (oldChannel) {
            const oldMsg = await oldChannel.messages.fetch(playerMsg.id).catch(() => null);
            if (oldMsg && oldMsg.deletable) {
              await oldMsg.delete().catch(() => null);
              global.db.data.guilds[player.guildId].message = null;
              await global.db.write();
            }
          }
        }

        if (player.lyricsMsg?.delete) {
            await player.lyricsMsg.delete().catch(() => {});
            player.lyricsMsg = null;
        }

        // Clean up queue messages
        if (player.queueMsgs && player.queueMsgs.length > 0) {
            for (const msg of player.queueMsgs) {
                if (msg?.delete) {
                    await msg.delete().catch(() => {});
                }
            }
            player.queueMsgs = [];
        }

        // Destroy player
        player.destroy(reason);
    } catch (err) {
        logger.error(`safeDestroyPlayer: Error destroying player: ${err.message}`);
    }
}

/**
 * Check if a node is available and healthy
 * @param {Manager} manager - MoonLink manager
 * @returns {boolean} - Whether any node is available
 */
function isNodeAvailable(manager) {
    try {
        if (!manager || !manager.nodes) return false;
        // Use NodeManager API properties
        return manager.nodes.hasReady || manager.nodes.hasOnlineNodes || false;
    } catch (err) {
        logger.debug(`isNodeAvailable: ${err.message}`);
        return false;
    }
}

/**
 * Get the best available node
 * @param {Manager} manager - MoonLink manager
 * @returns {Node|null} - Best node or null
 */
function getBestNode(manager) {
    try {
        if (!manager || !manager.nodes) return null;
        // Use NodeManager's built-in leastUsedNode or get from ready nodes
        return manager.nodes.leastUsedNode || 
               (manager.nodes.ready && manager.nodes.ready.length > 0 ? manager.nodes.ready[0] : null);
    } catch (err) {
        logger.debug(`getBestNode: ${err.message}`);
        return null;
    }
}

/**
 * Safely execute an async operation with timeout
 * @param {Function} fn - Async function to execute
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {string} operationName - Name of the operation for logging
 * @returns {Promise<any>} - Result or null on timeout
 */
async function withTimeout(fn, timeoutMs = 15000, operationName = 'operation') {
    try {
        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`${operationName} timed out after ${timeoutMs}ms`)), timeoutMs)
        );
        return await Promise.race([fn(), timeout]);
    } catch (err) {
        logger.error(`${operationName} error: ${err.message}`);
        throw err;
    }
}

module.exports = {
    sanitizeError,
    logError,
    formatDuration,
    withRetry,
    safeReply,
    getSafeChannel,
    getSafeGuild,
    hasRequiredPermissions,
    safeDestroyPlayer,
    isNodeAvailable,
    getBestNode,
    withTimeout,
    logger
};
