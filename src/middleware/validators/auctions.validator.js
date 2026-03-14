const { body } = require('express-validator');
const { validateRequest } = require('./validate-request');

const createAuctionValidation = (req, res, next) => {
    const {
        name,
        tournament_id,
        start_time,
        end_time,
        min_purse
    } = req.body;

    const errors = [];

    // Check required fields
    if (!name?.trim()) errors.push('Auction name is required');
    if (!tournament_id) errors.push('Tournament ID is required');
    if (!start_time) errors.push('Start time is required');
    if (!end_time) errors.push('End time is required');
    if (!min_purse) errors.push('Minimum purse is required');

    // Validate dates
    const startDate = new Date(start_time);
    const endDate = new Date(end_time);
    const now = new Date();

    if (isNaN(startDate.getTime())) errors.push('Invalid start time format');
    if (isNaN(endDate.getTime())) errors.push('Invalid end time format');
    if (startDate < now) errors.push('Start time must be in the future');
    if (endDate <= startDate) errors.push('End time must be after start time');

    // Validate numeric values
    if (min_purse < 1000000) errors.push('Minimum purse must be at least ₹10,00,000');

    if (errors.length > 0) {
        return res.status(400).json({
            message: 'Validation failed',
            errors
        });
    }

    next();
};

const placeBidValidation = (req, res, next) => {
    const { player_id, team_id, amount } = req.body;

    const errors = [];

    if (!player_id) errors.push('Player ID is required');
    if (!team_id) errors.push('Team ID is required');
    if (!amount) errors.push('Bid amount is required');
    if (amount < 0) errors.push('Bid amount must be positive');

    if (errors.length > 0) {
        return res.status(400).json({
            message: 'Validation failed',
            errors
        });
    }

    next();
};

const updateAuctionStatusValidation = (req, res, next) => {
    const { status } = req.body;

    if (!['upcoming', 'active', 'completed'].includes(status)) {
        return res.status(400).json({
            message: 'Invalid status value',
            allowedValues: ['upcoming', 'active', 'completed']
        });
    }

    next();
};

module.exports = {
    createAuctionValidation,
    placeBidValidation,
    updateAuctionStatusValidation
}; 