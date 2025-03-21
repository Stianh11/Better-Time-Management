const db = require('./sqliteConn');
const bcrypt = require('bcrypt');

async function initializeDatabase() {
  try {
    // Create users table if it doesn't exist
    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        role TEXT NOT NULL,
        password TEXT NOT NULL,
        active INTEGER DEFAULT 1
      )
    `);
    
    // Create leaves table if it doesn't exist
    await db.run(`
      CREATE TABLE IF NOT EXISTS leaves (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        reason TEXT,
        status TEXT DEFAULT 'pending',
        FOREIGN KEY (employee_id) REFERENCES users(id)
      )
    `);
    
    // Create timesheets table if it doesn't exist
    await db.run(`
      CREATE TABLE IF NOT EXISTS timesheets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        hours_worked REAL NOT NULL,
        status TEXT DEFAULT 'submitted',
        FOREIGN KEY (employee_id) REFERENCES users(id)
      )
    `);
    
    // Check if admin user exists, create one if not
    const adminUser = await db.get('SELECT COUNT(*) as count FROM users WHERE role = ?', ['admin']);
    
    if (adminUser.count === 0) {
      // Create default admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db.run(
        'INSERT INTO users (username, name, email, role, password) VALUES (?, ?, ?, ?, ?)',
        ['admin', 'Administrator', 'admin@example.com', 'admin', hashedPassword]
      );
      console.log('Default admin user created');
    }
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Execute if this file is run directly
if (require.main === module) {
  initializeDatabase().then(() => {
    console.log('Database setup complete');
    process.exit(0);
  });
}

module.exports = initializeDatabase;