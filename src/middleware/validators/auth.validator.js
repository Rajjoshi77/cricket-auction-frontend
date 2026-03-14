const { body } = require('express-validator');
const { validateRequest } = require('./validate-request');

const registerValidation = [
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 2, max: 100 }).withMessage('Username must be between 2 and 100 characters'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),

    body('password')
        .trim()
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),

    body('phone')
        .optional()
        .trim()
        .matches(/^[0-9+\-\s()]{8,20}$/).withMessage('Invalid phone number format'),

    body('role')
        .trim()
        .notEmpty().withMessage('Role is required')
        .isIn(['admin', 'team_owner']).withMessage('Invalid role'),

    validateRequest
];

const loginValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),

    body('password')
        .trim()
        .notEmpty().withMessage('Password is required'),

    validateRequest
];

module.exports = {
    registerValidation,
    loginValidation
}; 