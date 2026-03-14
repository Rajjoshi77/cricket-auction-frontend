const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');

// Validation rules
const registerValidation = [
    body('username').trim().isLength({ min: 3 }).escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('role').isIn(['admin', 'team_owner'])
];

const loginValidation = [
    body('email').isEmail().normalizeEmail(),
    body('password').exists()
];

// Routes
router.post('/register', registerValidation, validate, authController.register);
router.post('/login', loginValidation, validate, authController.login);

module.exports = router; 