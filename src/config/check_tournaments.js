const db = require('./db.config');

async function checkTournaments() {
    try {
        console.log('Checking tournaments in database...');

        // Check if tournaments table exists
        const [tables] = await db.query(`
            SHOW TABLES LIKE 'tournaments'
        `);

        if (tables.length === 0) {
            console.log('Tournaments table does not exist!');
            return;
        }

        console.log('Tournaments table exists, checking structure...');

        // Check table structure
        const [columns] = await db.query(`
            SHOW COLUMNS FROM tournaments
        `);

        console.log('Tournaments table structure:');
        columns.forEach(column => {
            console.log(`- ${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : ''} ${column.Key === 'PRI' ? 'PRIMARY KEY' : ''}`);
        });

        // Check if tournaments exist
        const [tournaments] = await db.query(`
            SELECT * FROM tournaments
        `);

        console.log(`\nFound ${tournaments.length} tournaments:`);
        tournaments.forEach(tournament => {
            console.log(`- ID: ${tournament.id}, Name: ${tournament.tournament_name}, Status: ${tournament.status}`);
        });

        // If no tournaments, insert a test one
        if (tournaments.length === 0) {
            console.log('\nNo tournaments found, inserting a test tournament...');

            const [result] = await db.query(
                `INSERT INTO tournaments (
                    tournament_name, season_year, start_date, end_date, registration_deadline,
                    max_teams, min_players_per_team, max_players_per_team,
                    base_budget_per_team, venue, description, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    'Test Tournament 2',
                    2024,
                    '2024-06-01',
                    '2024-07-30',
                    '2024-05-15',
                    8,
                    15,
                    25,
                    1000000.00,
                    'Test Stadium 2',
                    'This is another test tournament',
                    'upcoming'
                ]
            );

            console.log('Test tournament inserted successfully:', result);
        }
    } catch (error) {
        console.error('Error checking tournaments:', error);
    } finally {
        process.exit();
    }
}

checkTournaments(); 