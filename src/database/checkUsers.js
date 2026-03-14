const pool = require('../config/database');

async function checkUsers() {
    try {
        const [rows] = await pool.query('SELECT id, username, email, role FROM users');
        console.log('Users in database:');
        console.table(rows);
    } catch (error) {
        console.error('Error fetching users:', error);
    } finally {
        process.exit();
    }
}

checkUsers(); 