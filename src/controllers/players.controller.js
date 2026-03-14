const { Player } = require('../models');
const pool = require('../config/database');

// Get all players
exports.getAllPlayers = async (req, res) => {
    try {
        const [players] = await pool.query('SELECT * FROM players');
        res.json(players);
    } catch (error) {
        console.error('Error fetching players:', error);
        res.status(500).json({ message: 'Error fetching players', error: error.message });
    }
};

// Get player by ID
exports.getPlayerById = async (req, res) => {
    try {
        const [players] = await pool.query('SELECT * FROM players WHERE id = ?', [req.params.id]);
        if (players.length === 0) {
            return res.status(404).json({ message: 'Player not found' });
        }
        res.json(players[0]);
    } catch (error) {
        console.error('Error fetching player:', error);
        res.status(500).json({ message: 'Error fetching player', error: error.message });
    }
};

// Create player
exports.createPlayer = async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            age,
            country,
            role,
            specialization,
            base_price,
            profile_image_url
        } = req.body;

        const [result] = await pool.query(
            `INSERT INTO players (
                first_name, 
                last_name, 
                age, 
                country, 
                role, 
                specialization, 
                base_price, 
                profile_image_url,
                status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'available')`,
            [
                first_name,
                last_name,
                age,
                country,
                role,
                specialization,
                base_price,
                profile_image_url
            ]
        );

        const [newPlayer] = await pool.query('SELECT * FROM players WHERE id = ?', [result.insertId]);
        res.status(201).json({ message: 'Player created successfully', player: newPlayer[0] });
    } catch (error) {
        console.error('Error creating player:', error);
        res.status(500).json({ message: 'Error creating player', error: error.message });
    }
};

// Update player
exports.updatePlayer = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            first_name,
            last_name,
            age,
            country,
            role,
            specialization,
            base_price,
            profile_image_url
        } = req.body;

        // Check if player exists
        const [existingPlayer] = await pool.query('SELECT * FROM players WHERE id = ?', [id]);
        if (existingPlayer.length === 0) {
            return res.status(404).json({ message: 'Player not found' });
        }

        await pool.query(
            `UPDATE players SET 
            first_name = ?, 
            last_name = ?, 
            age = ?, 
            country = ?, 
            role = ?, 
            specialization = ?, 
            base_price = ?, 
            profile_image_url = ?,
            updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [
                first_name,
                last_name,
                age,
                country,
                role,
                specialization,
                base_price,
                profile_image_url,
                id
            ]
        );

        const [updatedPlayer] = await pool.query('SELECT * FROM players WHERE id = ?', [id]);
        res.json({ message: 'Player updated successfully', player: updatedPlayer[0] });
    } catch (error) {
        console.error('Error updating player:', error);
        res.status(500).json({ message: 'Error updating player', error: error.message });
    }
};

// Update player stats
exports.updatePlayerStats = async (req, res) => {
    try {
        const { id } = req.params;
        const { matches_played, runs_scored, wickets_taken, catches_taken } = req.body;

        // Start transaction
        await pool.query('START TRANSACTION');

        try {
            // Check if player exists
            const player = await Player.findByPk(id);
            if (!player) {
                throw new Error('Player not found');
            }

            // Update or create player statistics
            await pool.query(
                `INSERT INTO player_statistics 
                (player_id, matches_played, runs_scored, wickets_taken, catches_taken)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                matches_played = VALUES(matches_played),
                runs_scored = VALUES(runs_scored),
                wickets_taken = VALUES(wickets_taken),
                catches_taken = VALUES(catches_taken)`,
                [id, matches_played, runs_scored, wickets_taken, catches_taken]
            );

            // Commit transaction
            await pool.query('COMMIT');

            res.json({ message: 'Player statistics updated successfully' });
        } catch (error) {
            // Rollback in case of error
            await pool.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating player statistics', error: error.message });
    }
};

// Delete player
exports.deletePlayer = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if player exists
        const [existingPlayer] = await pool.query('SELECT * FROM players WHERE id = ?', [id]);
        if (existingPlayer.length === 0) {
            return res.status(404).json({ message: 'Player not found' });
        }

        await pool.query('DELETE FROM players WHERE id = ?', [id]);
        res.json({ message: 'Player deleted successfully' });
    } catch (error) {
        console.error('Error deleting player:', error);
        res.status(500).json({ message: 'Error deleting player', error: error.message });
    }
};

// Get player statistics
exports.getPlayerStatistics = async (req, res) => {
    try {
        const playerId = req.params.id;

        // First check if player exists
        const [player] = await pool.query('SELECT * FROM players WHERE id = ?', [playerId]);

        if (player.length === 0) {
            return res.status(404).json({ message: 'Player not found' });
        }

        // Get player statistics
        const [stats] = await pool.query(`
            SELECT 
                ps.*,
                p.first_name,
                p.last_name,
                p.role,
                p.specialization,
                p.country
            FROM players p
            LEFT JOIN player_statistics ps ON p.id = ps.player_id
            WHERE p.id = ?
        `, [playerId]);

        if (stats.length === 0) {
            // If no statistics exist, create default statistics
            await pool.query(`
                INSERT INTO player_statistics 
                (player_id, matches_played, runs_scored, wickets_taken, batting_average, bowling_average)
                VALUES (?, 0, 0, 0, 0.00, 0.00)
            `, [playerId]);

            // Return default statistics
            return res.json({
                player_id: playerId,
                matches_played: 0,
                runs_scored: 0,
                wickets_taken: 0,
                batting_average: 0.00,
                bowling_average: 0.00,
                first_name: player[0].first_name,
                last_name: player[0].last_name,
                role: player[0].role,
                specialization: player[0].specialization,
                country: player[0].country
            });
        }

        res.json(stats[0]);
    } catch (error) {
        console.error('Error fetching player statistics:', error);
        res.status(500).json({ message: 'Error fetching player statistics', error: error.message });
    }
};
