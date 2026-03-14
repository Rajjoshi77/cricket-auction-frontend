const express = require('express');
const router = express.Router();
const teamsController = require('../controllers/teams.controller');
const { authenticateToken, isTeamOwner } = require('../middleware/auth');

// Team management routes
router.post('/create', authenticateToken, isTeamOwner, teamsController.createTeam);
router.get('/my-team', authenticateToken, isTeamOwner, teamsController.getMyTeam);
router.post('/register-auction', authenticateToken, isTeamOwner, teamsController.registerForAuction);

// Player viewing routes for team owners
router.get('/players', authenticateToken, isTeamOwner, teamsController.getAllPlayers);
router.get('/players/:player_id', authenticateToken, isTeamOwner, teamsController.getPlayerDetails);

module.exports = router; 