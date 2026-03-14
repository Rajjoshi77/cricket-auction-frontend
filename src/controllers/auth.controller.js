const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db.config');

exports.register = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        console.log('Registration request:', { username, email, role });

        // Check if user already exists
        const [existingUsers] = await db.query(
            'SELECT * FROM users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert new user
        const [result] = await db.query(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, role || 'team_owner']
        );

        const token = jwt.sign(
            { id: result.insertId, role: role || 'team_owner' },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: result.insertId,
                username,
                email,
                role: role || 'team_owner'
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            message: 'Error registering user',
            error: error.message
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt for:', email);

        // Find user in users table
        const [users] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = users[0];
        console.log('User found:', { id: user.id, email: user.email, role: user.role });

        // Verify password
        try {
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }
        } catch (bcryptError) {
            console.error('Password verification error:', bcryptError);
            return res.status(500).json({
                message: 'Error verifying password',
                error: bcryptError.message
            });
        }

        // Create token
        const token = jwt.sign(
            {
                id: user.id,
                role: user.role
            },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '24h' }
        );

        // Send response
        res.json({
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
        res.status(500).json({
            message: 'Error during login',
            error: error.message
        });
    }
};

exports.verifyToken = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.json({ valid: false, message: 'No token provided' });
        }

        jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', async (err, decoded) => {
            if (err) {
                return res.json({ valid: false, message: 'Invalid token' });
            }

            console.log('Token verified successfully for user:', decoded);

            // Check if user still exists in database using the users table
            try {
                const [users] = await db.query(
                    'SELECT * FROM users WHERE id = ?',
                    [decoded.id]
                );

                if (users.length === 0) {
                    return res.json({ valid: false, message: 'User not found' });
                }

                res.json({ valid: true, user: decoded });
            } catch (dbError) {
                console.error('Database error during token verification:', dbError);
                return res.json({
                    valid: false,
                    message: 'Database error during verification',
                    error: dbError.message
                });
            }
        });
    } catch (error) {
        console.error('Token verification error:', error);
        res.json({ valid: false, message: 'Error verifying token' });
    }
}; 