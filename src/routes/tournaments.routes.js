const express = require('express');
const router = express.Router();
const tournamentsController = require('../controllers/tournaments.controller');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all tournaments
router.get('/', tournamentsController.getAllTournaments);

// Get tournament by ID
router.get('/:id', tournamentsController.getTournamentById);

// Create new tournament (admin only)
router.post('/', isAdmin, tournamentsController.createTournament);

// Update tournament (admin only)
router.put('/:id', isAdmin, tournamentsController.updateTournament);

// Delete tournament (admin only)
router.delete('/:id', isAdmin, tournamentsController.deleteTournament);

module.exports = router;