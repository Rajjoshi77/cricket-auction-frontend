const express = require('express');
const router = express.Router();
const teamsController = require('../controllers/teams.controller');
const { authenticateToken, isTeamOwner } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Team management routes
router.post('/create', authenticateToken, isTeamOwner, upload.single('logo_image'), teamsController.createTeam);
router.get('/my-team', authenticateToken, isTeamOwner, teamsController.getMyTeam);
router.post('/register-auction', authenticateToken, isTeamOwner, teamsController.registerForAuction);

// Team viewing routes
router.get('/', teamsController.getAllTeams);
router.get('/:id', teamsController.getTeamById);

// Player viewing routes for team owners
router.get('/players', authenticateToken, isTeamOwner, teamsController.getAllPlayers);
router.get('/players/:player_id', authenticateToken, isTeamOwner, teamsController.getPlayerDetails);

// Update team
router.put('/:id', authenticateToken, isTeamOwner, upload.single('logo_image'), teamsController.updateTeam);
router.delete('/:id', authenticateToken, teamsController.deleteTeam);

module.exports = router; 