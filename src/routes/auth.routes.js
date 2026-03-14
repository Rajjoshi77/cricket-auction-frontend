const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { registerValidation, loginValidation } = require('../middleware/validators/auth.validator');

// Register new user
router.post('/register', registerValidation, authController.register);

// Login user
router.post('/login', loginValidation, authController.login);

// Verify token
router.get('/verify', authController.verifyToken);

module.exports = router; 