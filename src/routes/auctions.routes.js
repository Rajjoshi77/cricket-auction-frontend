const express = require('express');
const router = express.Router();
const auctionsController = require('../controllers/auctions.controller');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const {
    createAuctionValidation,
    placeBidValidation,
    updateAuctionStatusValidation
} = require('../middleware/validators/auctions.validator');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all auctions
router.get('/', auctionsController.getAllAuctions);

// Get auction by ID
router.get('/:id', auctionsController.getAuctionById);

// Create new auction (admin only)
router.post('/', isAdmin, auctionsController.createAuction);

// Update auction (admin only)
router.put('/:id', isAdmin, auctionsController.updateAuction);

// Add player to auction (admin only)
router.post('/:id/players', isAdmin, auctionsController.addPlayerToAuction);

// Register team for auction
router.post('/:id/register', auctionsController.registerTeamForAuction);

// Check if team is registered for auction
router.get('/:id/registration-status', auctionsController.checkRegistrationStatus);

// Start auction (admin only)
router.post('/:id/start', isAdmin, auctionsController.startAuction);

// End auction (admin only)
router.post('/:id/end', isAdmin, auctionsController.endAuction);

// Update auction status (admin only)
router.patch('/:id/status', isAdmin, updateAuctionStatusValidation, auctionsController.updateAuctionStatus);

// Get my team details for auction (team owner only)
router.get('/:id/my-team', auctionsController.getMyTeamDetails);

// Place bid
router.post('/:id/bid', placeBidValidation, auctionsController.placeBid);

module.exports = router; 