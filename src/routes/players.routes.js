const express = require('express');
const router = express.Router();
const playersController = require('../controllers/players.controller');
const { authenticateToken } = require('../middleware/auth');

// Get all players
router.get('/', playersController.getAllPlayers);

// Get player by ID
router.get('/:id', playersController.getPlayerById);

// Get player statistics
router.get('/:id/statistics', playersController.getPlayerStatistics);

// Create new player
router.post('/', authenticateToken, playersController.createPlayer);

// Update player
router.put('/:id', authenticateToken, playersController.updatePlayer);

// Delete player
router.delete('/:id', authenticateToken, playersController.deletePlayer);

module.exports = router; 