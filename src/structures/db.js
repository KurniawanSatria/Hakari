const path = require('path');

let dbPromise = null;

async function initDB() {
    if (dbPromise) return dbPromise;

    dbPromise = (async () => {
        const { JSONFilePreset } = await import('lowdb/node');
        const file = path.join(process.cwd(), 'player_msgs.json');
        const defaultData = { messages: {} };
        const db = await JSONFilePreset(file, defaultData);
        return db;
    })();

    return dbPromise;
}

async function setPlayerMsg(guildId, data) {
    const db = await initDB();
    db.data.messages[guildId] = data;
    await db.write();
}

async function getPlayerMsg(guildId) {
    const db = await initDB();
    return db.data.messages[guildId] || null;
}

async function removePlayerMsg(guildId) {
    const db = await initDB();
    if (db.data.messages[guildId]) {
        delete db.data.messages[guildId];
        await db.write();
    }
}

module.exports = { initDB, setPlayerMsg, getPlayerMsg, removePlayerMsg };
