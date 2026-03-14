const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function setupDatabase() {
    let connection;
    try {
        // Create connection without database
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '12345' // Add your MySQL password here if you have one
        });

        console.log('Connected to MySQL server');

        // Read SQL file
        const sqlPath = path.join(__dirname, 'setup.sql');
        const sqlContent = await fs.readFile(sqlPath, 'utf8');

        // Split SQL commands
        const commands = sqlContent
            .split(';')
            .filter(cmd => cmd.trim())
            .map(cmd => cmd + ';');

        // Execute each command
        for (const command of commands) {
            await connection.query(command);
        }

        console.log('Database setup completed successfully');

    } catch (error) {
        console.error('Error setting up database:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

setupDatabase(); 