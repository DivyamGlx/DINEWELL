const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

let dbInstance = null;

async function getDb() {
    if (!dbInstance) {
        dbInstance = await open({
            filename: path.join(__dirname, 'dinewell.db'),
            driver: sqlite3.Database
        });
    }
    return dbInstance;
}

// For the sake of the assignment, we export a proxy or a way to get the db
// The user says "const db = require('./db'); returns sqlite database instance"
// Since open() is async, we might need a sync way or just export the promise.
// But usually in these assignments, it's a pre-opened instance.

module.exports = {
    get: async (...args) => (await getDb()).get(...args),
    all: async (...args) => (await getDb()).all(...args),
    run: async (...args) => (await getDb()).run(...args),
    exec: async (...args) => (await getDb()).exec(...args)
};
