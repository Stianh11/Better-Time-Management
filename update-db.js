const db = require('./config/sqliteConn');

async function updateDatabase() {
    try {
        // Check if profile_image column exists in users table
        const tableInfo = await db.all("PRAGMA table_info(users)");
        const hasProfileImageColumn = tableInfo.some(column => column.name === 'profile_image');
        
        if (!hasProfileImageColumn) {
            console.log('Adding profile_image column to users table...');
            await db.run('ALTER TABLE users ADD COLUMN profile_image TEXT');
            console.log('Successfully added profile_image column to users table');
        } else {
            console.log('profile_image column already exists in users table');
        }
        
        console.log('Database update completed successfully');
    } catch (error) {
        console.error('Error updating database:', error);
    }
}

updateDatabase();
