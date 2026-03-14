const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authController = {
    register: async (req, res) => {
        try {
            console.log('Registration request received:', req.body);
            const { username, email, password, role } = req.body;

            // Check if user already exists
            console.log('Checking for existing user...');
            const [existingUsers] = await pool.query(
                'SELECT * FROM users WHERE email = ? OR username = ?',
                [email, username]
            );

            if (existingUsers.length > 0) {
                console.log('User already exists');
                return res.status(400).json({
                    message: 'User with this email or username already exists'
                });
            }

            // Hash password
            console.log('Hashing password...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Insert new user
            console.log('Inserting new user...');
            const [result] = await pool.query(
                'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
                [username, email, hashedPassword, role]
            );

            console.log('User inserted successfully:', result);

            // Generate JWT token
            console.log('Generating token...');
            const token = jwt.sign(
                { id: result.insertId, role },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            console.log('Registration successful');
            res.status(201).json({
                message: 'User registered successfully',
                token,
                user: {
                    id: result.insertId,
                    username,
                    email,
                    role
                }
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                message: 'Error registering user',
                error: error.message
            });
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            // Find user
            const [users] = await pool.query(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );

            if (users.length === 0) {
                return res.status(401).json({
                    message: 'Invalid email or password'
                });
            }

            const user = users[0];

            // Check password
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({
                    message: 'Invalid email or password'
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                { id: user.id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                message: 'Logged in successfully',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ message: 'Error logging in' });
        }
    }
};

module.exports = authController; 