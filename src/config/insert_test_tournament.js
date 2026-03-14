const db = require('./db.config');

async function insertTestTournament() {
    try {
        console.log('Inserting test tournament...');

        // Check if test tournament already exists
        const [existingTournaments] = await db.query(
            "SELECT * FROM tournaments WHERE tournament_name = 'Test Tournament'"
        );

        if (existingTournaments.length > 0) {
            console.log('Test tournament already exists:', existingTournaments[0]);
            return;
        }

        // Insert test tournament
        const [result] = await db.query(
            `INSERT INTO tournaments (
                tournament_name, season_year, start_date, end_date, registration_deadline,
                max_teams, min_players_per_team, max_players_per_team,
                base_budget_per_team, venue, description, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'Test Tournament',
                2023,
                '2023-06-01',
                '2023-07-30',
                '2023-05-15',
                8,
                15,
                25,
                1000000.00,
                'Test Stadium',
                'This is a test tournament',
                'upcoming'
            ]
        );

        console.log('Test tournament inserted successfully:', result);
    } catch (error) {
        console.error('Error inserting test tournament:', error);
    } finally {
        process.exit();
    }
}

insertTestTournament(); 