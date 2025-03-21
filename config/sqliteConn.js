const sqlite3 = require('sqlite3').verbose();

// Create or open the database
const db = new sqlite3.Database('users.db');

// Create tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT
    )
  `);
  db.run(`
    INSERT INTO users (username, password, role)
    SELECT 'admin', 'password123', 'admin'
    WHERE NOT EXISTS(SELECT 1 FROM users WHERE username = 'admin')
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS nfc_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      code TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
});

module.exports = db;