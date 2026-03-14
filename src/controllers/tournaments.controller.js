const db = require('../config/db.config');

// Get all tournaments
exports.getAllTournaments = async (req, res) => {
    try {
        console.log('Fetching all tournaments...');
        const [tournaments] = await db.query('SELECT * FROM tournaments');
        console.log(`Found ${tournaments.length} tournaments`);
        res.json(tournaments);
    } catch (error) {
        console.error('Error fetching tournaments:', error);
        res.status(500).json({ message: 'Error fetching tournaments', error: error.message });
    }
};

// Get tournament by ID
exports.getTournamentById = async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`Fetching tournament with ID: ${id}`);
        console.log('User info from token:', req.user);

        if (!id || isNaN(parseInt(id))) {
            console.log(`Invalid tournament ID: ${id}`);
            return res.status(400).json({ message: 'Invalid tournament ID' });
        }

        // Fetch basic tournament data
        const [tournaments] = await db.query('SELECT * FROM tournaments WHERE id = ?', [id]);

        if (tournaments.length === 0) {
            console.log(`Tournament with ID ${id} not found`);
            return res.status(404).json({ message: 'Tournament not found' });
        }

        const tournament = tournaments[0];
        console.log('Tournament found:', tournament);

        // Fetch teams participating in this tournament
        let teams = [];
        try {
            const [teamsResult] = await db.query(`
                SELECT t.*, tb.remaining_budget, tb.total_budget,
                       u.username as owner_name,
                       (SELECT COUNT(*) FROM team_players tp WHERE tp.team_id = t.id) as total_players
                FROM teams t
                JOIN team_registrations tr ON t.id = tr.team_id
                JOIN team_budget tb ON t.id = tb.team_id AND tb.tournament_id = ?
                JOIN users u ON t.owner_id = u.id
                WHERE tr.tournament_id = ?
            `, [id, id]);
            teams = teamsResult;
            console.log(`Found ${teams.length} teams for tournament`);
        } catch (teamError) {
            console.error('Error fetching teams for tournament:', teamError);
            // Continue with empty teams array
        }

        // Fetch matches for this tournament
        let matches = [];
        try {
            const [matchesResult] = await db.query(`
                SELECT m.*, 
                       t1.team_name as team1_name, 
                       t2.team_name as team2_name,
                       winner.team_name as winner_name
                FROM matches m
                LEFT JOIN teams t1 ON m.team1_id = t1.id
                LEFT JOIN teams t2 ON m.team2_id = t2.id
                LEFT JOIN teams winner ON m.winner_id = winner.id
                WHERE m.tournament_id = ?
                ORDER BY m.match_date
            `, [id]);
            matches = matchesResult;
            console.log(`Found ${matches.length} matches for tournament`);
        } catch (matchError) {
            console.error('Error fetching matches for tournament:', matchError);
            // Continue with empty matches array
        }

        // Fetch tournament statistics (placeholder - actual implementation would depend on your schema)
        let statistics = {
            team_statistics: [],
            top_batsmen: [],
            top_bowlers: []
        };

        try {
            // This is a placeholder for team statistics - adjust SQL as needed for your schema
            const [teamStats] = await db.query(`
                SELECT 
                    t.id as team_id,
                    t.team_name,
                    COUNT(m.id) as matches_played,
                    COUNT(CASE WHEN m.winner_id = t.id THEN 1 END) as matches_won,
                    COUNT(CASE WHEN m.winner_id IS NOT NULL AND m.winner_id != t.id THEN 1 END) as matches_lost,
                    COUNT(CASE WHEN m.winner_id = t.id THEN 1 END) * 2 as points,
                    0.0 as net_run_rate
                FROM teams t
                JOIN team_registrations tr ON t.id = tr.team_id AND tr.tournament_id = ?
                LEFT JOIN matches m ON (m.team1_id = t.id OR m.team2_id = t.id) AND m.tournament_id = ?
                GROUP BY t.id, t.team_name
                ORDER BY points DESC, net_run_rate DESC
            `, [id, id]);

            console.log(`Found ${teamStats.length} team statistics entries`);
            statistics.team_statistics = teamStats;

            // Placeholder for top batsmen - adjust as needed
            const [topBatsmen] = await db.query(`
                SELECT 
                    p.id as player_id,
                    p.first_name,
                    p.last_name,
                    p.country,
                    0 as runs_scored,
                    0.0 as batting_average
                FROM players p
                JOIN team_players tp ON p.id = tp.player_id
                JOIN team_registrations tr ON tp.team_id = tr.team_id AND tr.tournament_id = ?
                LIMIT 5
            `, [id]);

            console.log(`Found ${topBatsmen.length} top batsmen`);
            statistics.top_batsmen = topBatsmen;

            // Placeholder for top bowlers - adjust as needed
            const [topBowlers] = await db.query(`
                SELECT 
                    p.id as player_id,
                    p.first_name,
                    p.last_name,
                    p.country,
                    0 as wickets_taken,
                    0.0 as bowling_average
                FROM players p
                JOIN team_players tp ON p.id = tp.player_id
                JOIN team_registrations tr ON tp.team_id = tr.team_id AND tr.tournament_id = ?
                LIMIT 5
            `, [id]);

            console.log(`Found ${topBowlers.length} top bowlers`);
            statistics.top_bowlers = topBowlers;

        } catch (statError) {
            console.error('Error fetching tournament statistics:', statError);
            // Continue with the response, but with empty statistics
        }

        // Create a full tournament object with related data
        const fullTournament = {
            ...tournament,
            teams: teams || [],
            matches: matches || [],
            statistics: statistics || {
                team_statistics: [],
                top_batsmen: [],
                top_bowlers: []
            }
        };

        res.json(fullTournament);
    } catch (error) {
        console.error('Error fetching tournament details:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            message: 'Error fetching tournament details',
            error: error.message,
            stack: error.stack
        });
    }
};

// Create new tournament
exports.createTournament = async (req, res) => {
    try {
        console.log('Creating new tournament with data:', req.body);
        const {
            tournament_name,
            season_year,
            start_date,
            end_date,
            registration_deadline,
            max_teams,
            min_players_per_team,
            max_players_per_team,
            base_budget_per_team,
            venue,
            description,
            status
        } = req.body;

        // Validate required fields
        if (!tournament_name || !season_year || !start_date || !end_date || !registration_deadline) {
            return res.status(400).json({
                message: 'Missing required fields',
                required: ['tournament_name', 'season_year', 'start_date', 'end_date', 'registration_deadline']
            });
        }

        // Insert tournament
        const [result] = await db.query(
            `INSERT INTO tournaments (
                tournament_name, season_year, start_date, end_date, registration_deadline,
                max_teams, min_players_per_team, max_players_per_team,
                base_budget_per_team, venue, description, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                tournament_name,
                season_year,
                start_date,
                end_date,
                registration_deadline,
                max_teams || 8,
                min_players_per_team || 15,
                max_players_per_team || 25,
                base_budget_per_team || 1000000.00,
                venue,
                description,
                status || 'upcoming'
            ]
        );

        console.log('Tournament created successfully:', result);
        res.status(201).json({
            message: 'Tournament created successfully',
            tournament_id: result.insertId
        });
    } catch (error) {
        console.error('Error creating tournament:', error);
        res.status(500).json({
            message: 'Error creating tournament',
            error: error.message
        });
    }
};

// Update tournament
exports.updateTournament = async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`Updating tournament with ID: ${id}`, req.body);
        const {
            tournament_name,
            season_year,
            start_date,
            end_date,
            registration_deadline,
            max_teams,
            min_players_per_team,
            max_players_per_team,
            base_budget_per_team,
            venue,
            description,
            status
        } = req.body;

        const [result] = await db.query(
            `UPDATE tournaments SET
                tournament_name = ?,
                season_year = ?,
                start_date = ?,
                end_date = ?,
                registration_deadline = ?,
                max_teams = ?,
                min_players_per_team = ?,
                max_players_per_team = ?,
                base_budget_per_team = ?,
                venue = ?,
                description = ?,
                status = ?
            WHERE id = ?`,
            [
                tournament_name,
                season_year,
                start_date,
                end_date,
                registration_deadline,
                max_teams,
                min_players_per_team,
                max_players_per_team,
                base_budget_per_team,
                venue,
                description,
                status,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Tournament not found' });
        }

        console.log('Tournament updated successfully');
        res.json({ message: 'Tournament updated successfully' });
    } catch (error) {
        console.error('Error updating tournament:', error);
        res.status(500).json({
            message: 'Error updating tournament',
            error: error.message
        });
    }
};

// Delete tournament
exports.deleteTournament = async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`Deleting tournament with ID: ${id}`);
        const [result] = await db.query('DELETE FROM tournaments WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Tournament not found' });
        }

        console.log('Tournament deleted successfully');
        res.json({ message: 'Tournament deleted successfully' });
    } catch (error) {
        console.error('Error deleting tournament:', error);
        res.status(500).json({
            message: 'Error deleting tournament',
            error: error.message
        });
    }
};

// Register team for tournament
exports.registerTeam = async (req, res) => {
    try {
        const { team_id, total_budget } = req.body;
        const tournament_id = req.params.id;

        // Start transaction
        await db.query('START TRANSACTION');

        // Check if team is already registered
        const [existing] = await db.query(
            'SELECT * FROM team_budget WHERE team_id = ? AND tournament_id = ?',
            [team_id, tournament_id]
        );

        if (existing.length > 0) {
            await db.query('ROLLBACK');
            return res.status(400).json({ message: 'Team already registered for this tournament' });
        }

        // Register team with initial budget
        await db.query(
            `INSERT INTO team_budget 
             (team_id, tournament_id, total_budget, remaining_budget) 
             VALUES (?, ?, ?, ?)`,
            [team_id, tournament_id, total_budget, total_budget]
        );

        // Commit transaction
        await db.query('COMMIT');

        res.json({ message: 'Team registered successfully' });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Error registering team:', error);
        res.status(500).json({ message: 'Error registering team' });
    }
};

// Update tournament status
exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const tournament_id = req.params.id;

        await db.query(
            'UPDATE tournaments SET status = ? WHERE tournament_id = ?',
            [status, tournament_id]
        );

        res.json({ message: 'Tournament status updated successfully' });
    } catch (error) {
        console.error('Error updating tournament status:', error);
        res.status(500).json({ message: 'Error updating tournament status' });
    }
};

// Get tournament statistics
exports.getTournamentStats = async (req, res) => {
    try {
        const tournament_id = req.params.id;

        // Get team statistics
        const [teamStats] = await db.query(
            `SELECT ts.*, t.team_name
             FROM team_statistics ts
             JOIN teams t ON ts.team_id = t.team_id
             WHERE ts.tournament_id = ?
             ORDER BY ts.points DESC, ts.net_run_rate DESC`,
            [tournament_id]
        );

        // Get top performers
        const [topBatsmen] = await db.query(
            `SELECT p.*, ps.runs_scored, ps.batting_average
             FROM players p
             JOIN player_statistics ps ON p.player_id = ps.player_id
             WHERE p.current_team_id IN (
                 SELECT team_id FROM team_budget WHERE tournament_id = ?
             )
             ORDER BY ps.runs_scored DESC
             LIMIT 5`,
            [tournament_id]
        );

        const [topBowlers] = await db.query(
            `SELECT p.*, ps.wickets_taken, ps.bowling_average
             FROM players p
             JOIN player_statistics ps ON p.player_id = ps.player_id
             WHERE p.current_team_id IN (
                 SELECT team_id FROM team_budget WHERE tournament_id = ?
             )
             ORDER BY ps.wickets_taken DESC
             LIMIT 5`,
            [tournament_id]
        );

        res.json({
            team_statistics: teamStats,
            top_batsmen: topBatsmen,
            top_bowlers: topBowlers
        });
    } catch (error) {
        console.error('Error fetching tournament statistics:', error);
        res.status(500).json({ message: 'Error fetching tournament statistics' });
    }
};