const { body } = require('express-validator');
const { validateRequest } = require('./validate-request');

const createPlayerValidation = (req, res, next) => {
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

    const errors = [];

    // Check required fields
    if (!first_name || typeof first_name !== 'string' || !first_name.trim()) {
        errors.push('First name is required');
    }
    if (!last_name || typeof last_name !== 'string' || !last_name.trim()) {
        errors.push('Last name is required');
    }
    if (!age) {
        errors.push('Age is required');
    }
    if (!country || typeof country !== 'string' || !country.trim()) {
        errors.push('Country is required');
    }
    if (!role || typeof role !== 'string' || !role.trim()) {
        errors.push('Role is required');
    }
    if (!specialization || typeof specialization !== 'string' || !specialization.trim()) {
        errors.push('Specialization is required');
    }
    if (!base_price) {
        errors.push('Base price is required');
    }

    // Convert and validate numeric fields
    const parsedAge = parseInt(age);
    const parsedBasePrice = parseFloat(base_price);

    if (isNaN(parsedAge) || parsedAge < 16 || parsedAge > 50) {
        errors.push('Age must be between 16 and 50');
    }

    if (isNaN(parsedBasePrice) || parsedBasePrice < 100000) {
        errors.push('Base price must be at least ₹100,000');
    }

    // Validate enums
    const validRoles = ['batsman', 'bowler', 'all_rounder', 'wicket_keeper'];
    const validSpecializations = ['right_handed', 'left_handed', 'fast', 'spin'];

    if (!validRoles.includes(role?.toLowerCase())) {
        errors.push(`Role must be one of: ${validRoles.join(', ')}`);
    }

    if (!validSpecializations.includes(specialization?.toLowerCase())) {
        errors.push(`Specialization must be one of: ${validSpecializations.join(', ')}`);
    }

    if (errors.length > 0) {
        return res.status(400).json({
            message: 'Validation failed',
            errors
        });
    }

    // Convert values to proper format
    req.body.age = parsedAge;
    req.body.base_price = parsedBasePrice;
    req.body.role = role.toLowerCase();
    req.body.specialization = specialization.toLowerCase();
    req.body.first_name = first_name.trim();
    req.body.last_name = last_name.trim();
    req.body.country = country.trim();
    req.body.profile_image_url = profile_image_url || null;

    next();
};

const updatePlayerValidation = createPlayerValidation;

module.exports = {
    createPlayerValidation,
    updatePlayerValidation
}; 