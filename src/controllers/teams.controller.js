const db = require('../config/db.config');
const pool = require('../config/database');
const jwt = require('jsonwebtoken');

// Get all teams
exports.getAllTeams = async (req, res) => {
    try {
        const [teams] = await db.query(
            `SELECT t.*, o.name as owner_name 
             FROM teams t 
             LEFT JOIN team_owners o ON t.owner_id = o.owner_id`
        );
        res.json(teams);
    } catch (error) {
        console.error('Error fetching teams:', error);
        res.status(500).json({ message: 'Error fetching teams' });
    }
};

// Get team by ID
exports.getTeamById = async (req, res) => {
    try {
        const [teams] = await db.query(
            `SELECT t.*, o.name as owner_name 
             FROM teams t 
             LEFT JOIN team_owners o ON t.owner_id = o.owner_id 
             WHERE t.team_id = ?`,
            [req.params.id]
        );

        if (teams.length === 0) {
            return res.status(404).json({ message: 'Team not found' });
        }

        res.json(teams[0]);
    } catch (error) {
        console.error('Error fetching team:', error);
        res.status(500).json({ message: 'Error fetching team' });
    }
};

// Create a new team
exports.createTeam = async (req, res) => {
    try {
        const { name, city, state, home_ground, logo_url } = req.body;
        const owner_id = req.user.id; // From auth middleware

        // Check if owner already has a team
        const [existingTeam] = await pool.query(
            'SELECT * FROM teams WHERE owner_id = ?',
            [owner_id]
        );

        if (existingTeam.length > 0) {
            return res.status(400).json({ message: 'You already have a team' });
        }

        const [result] = await pool.query(
            'INSERT INTO teams (name, owner_id, city, state, home_ground, logo_url) VALUES (?, ?, ?, ?, ?, ?)',
            [name, owner_id, city, state, home_ground, logo_url]
        );

        res.status(201).json({
            message: 'Team created successfully',
            team_id: result.insertId
        });
    } catch (error) {
        console.error('Error creating team:', error);
        res.status(500).json({ message: 'Error creating team', error: error.message });
    }
};

// Update team
exports.updateTeam = async (req, res) => {
    try {
        const { team_name, home_ground, team_logo_url, established_year } = req.body;
        const team_id = req.params.id;

        // Check if user is team owner or admin
        const [teams] = await db.query(
            'SELECT owner_id FROM teams WHERE team_id = ?',
            [team_id]
        );

        if (teams.length === 0) {
            return res.status(404).json({ message: 'Team not found' });
        }

        if (req.user.role !== 'admin' && teams[0].owner_id !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this team' });
        }

        await db.query(
            'UPDATE teams SET team_name = ?, home_ground = ?, team_logo_url = ?, established_year = ? WHERE team_id = ?',
            [team_name, home_ground, team_logo_url, established_year, team_id]
        );

        res.json({ message: 'Team updated successfully' });
    } catch (error) {
        console.error('Error updating team:', error);
        res.status(500).json({ message: 'Error updating team' });
    }
};

// Delete team
exports.deleteTeam = async (req, res) => {
    try {
        const team_id = req.params.id;

        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admin can delete teams' });
        }

        const [result] = await db.query(
            'DELETE FROM teams WHERE team_id = ?',
            [team_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Team not found' });
        }

        res.json({ message: 'Team deleted successfully' });
    } catch (error) {
        console.error('Error deleting team:', error);
        res.status(500).json({ message: 'Error deleting team' });
    }
};

// Get team details for the logged-in owner
exports.getMyTeam = async (req, res) => {
    try {
        const owner_id = req.user.id;

        const [team] = await pool.query(
            'SELECT * FROM teams WHERE owner_id = ?',
            [owner_id]
        );

        if (team.length === 0) {
            return res.status(404).json({ message: 'Team not found' });
        }

        // Get team players
        const [players] = await pool.query(`
            SELECT p.*, tp.purchase_price 
            FROM players p 
            JOIN team_players tp ON p.id = tp.player_id 
            WHERE tp.team_id = ?`,
            [team[0].id]
        );

        res.json({
            ...team[0],
            players
        });
    } catch (error) {
        console.error('Error fetching team:', error);
        res.status(500).json({ message: 'Error fetching team', error: error.message });
    }
};

// Register team for an auction
exports.registerForAuction = async (req, res) => {
    try {
        const { auction_id, purse_amount } = req.body;
        const owner_id = req.user.id;

        // Get team id
        const [team] = await pool.query(
            'SELECT id, remaining_budget FROM teams WHERE owner_id = ?',
            [owner_id]
        );

        if (team.length === 0) {
            return res.status(404).json({ message: 'Team not found' });
        }

        if (purse_amount > team[0].remaining_budget) {
            return res.status(400).json({ message: 'Insufficient budget' });
        }

        // Check if already registered
        const [existingReg] = await pool.query(
            'SELECT * FROM team_auction_registrations WHERE team_id = ? AND auction_id = ?',
            [team[0].id, auction_id]
        );

        if (existingReg.length > 0) {
            return res.status(400).json({ message: 'Already registered for this auction' });
        }

        // Register for auction
        await pool.query(
            'INSERT INTO team_auction_registrations (team_id, auction_id, purse_amount) VALUES (?, ?, ?)',
            [team[0].id, auction_id, purse_amount]
        );

        res.json({ message: 'Successfully registered for auction' });
    } catch (error) {
        console.error('Error registering for auction:', error);
        res.status(500).json({ message: 'Error registering for auction', error: error.message });
    }
};

// Get all players (for team owner view)
exports.getAllPlayers = async (req, res) => {
    try {
        const [players] = await pool.query('SELECT * FROM players');
        res.json(players);
    } catch (error) {
        console.error('Error fetching players:', error);
        res.status(500).json({ message: 'Error fetching players', error: error.message });
    }
};

// Get detailed player information
exports.getPlayerDetails = async (req, res) => {
    try {
        const { player_id } = req.params;
        const [player] = await pool.query(
            'SELECT * FROM players WHERE id = ?',
            [player_id]
        );

        if (player.length === 0) {
            return res.status(404).json({ message: 'Player not found' });
        }

        // Get player statistics and history
        const [stats] = await pool.query(
            'SELECT * FROM player_statistics WHERE player_id = ?',
            [player_id]
        );

        res.json({
            ...player[0],
            statistics: stats[0] || {}
        });
    } catch (error) {
        console.error('Error fetching player details:', error);
        res.status(500).json({ message: 'Error fetching player details', error: error.message });
    }
};

module.exports = {
    getAllTeams,
    getTeamById,
    createTeam,
    updateTeam,
    deleteTeam,
    getMyTeam,
    registerForAuction,
    getAllPlayers,
    getPlayerDetails
}; 