const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./config/db.config');
const path = require('path');
const fs = require('fs');
const tournamentRoutes = require('./routes/tournaments.routes');
const auctionRoutes = require('./routes/auctions.routes');
const playerRoutes = require('./routes/players.routes');
const authRoutes = require('./routes/auth.routes');
const http = require('http');
const { initializeSocket } = require('./socket/auctionSocket');

const app = express();
const server = http.createServer(app);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// CORS Configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5000', 'http://localhost:5001', 'https://rajjoshi77.github.io'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

// Database connection test middleware
app.use(async (req, res, next) => {
    try {
        await pool.query('SELECT 1');
        next();
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ message: 'Database connection error' });
    }
});

// Mount routes
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/auth', authRoutes);

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

// User profile route
app.get('/api/users/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Verify that the requesting user is accessing their own profile or is an admin
        if (req.user.id !== parseInt(id) && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Query from users table
        const [result] = await pool.query(
            'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
            [id]
        );

        if (result.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(result[0]);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({
            message: 'Error fetching user profile',
            error: error.message
        });
    }
});

// Test route
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!' });
});

// Test route for tournaments
app.get('/test/tournaments', async (req, res) => {
    try {
        console.log('Testing tournaments table...');
        const [tournaments] = await pool.query('SELECT * FROM tournaments');
        console.log(`Found ${tournaments.length} tournaments:`, tournaments);
        res.json({
            message: `Found ${tournaments.length} tournaments`,
            tournaments
        });
    } catch (error) {
        console.error('Error testing tournaments:', error);
        res.status(500).json({
            message: 'Error testing tournaments',
            error: error.message,
            stack: error.stack
        });
    }
});

// Test route for database
app.get('/test/db', async (req, res) => {
    try {
        const [result] = await pool.query('SHOW TABLES');
        res.json({
            message: 'Database connection successful',
            tables: result.map(row => Object.values(row)[0])
        });
    } catch (error) {
        console.error('Database test error:', error);
        res.status(500).json({
            message: 'Database connection failed',
            error: error.message
        });
    }
});

// Test route for authentication
app.get('/test/auth', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log('Testing authentication...');
    console.log('Auth header:', authHeader);
    console.log('Token:', token ? token.substring(0, 15) + '...' : 'No token');

    if (!token) {
        return res.status(401).json({
            message: 'No token provided',
            success: false
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        console.log('Token verified successfully:', decoded);
        res.json({
            message: 'Authentication successful',
            user: decoded,
            success: true
        });
    } catch (error) {
        console.error('Token verification failed:', error);
        res.status(403).json({
            message: 'Invalid or expired token',
            error: error.message,
            success: false
        });
    }
});

// Simple registration route
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        console.log('Received registration request:', { username, email, role });

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if user already exists
        const [existingUsers] = await pool.query(
            'SELECT * FROM users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user into users table
        const [result] = await pool.query(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, role || 'team_owner']
        );

        console.log('User inserted:', result);

        // Generate JWT token
        const token = jwt.sign(
            { id: result.insertId, role: role || 'team_owner' },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Registration successful',
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
            message: 'Registration failed',
            error: error.message
        });
    }
});

// Login route
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt for:', email);

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find user in users table with detailed error handling
        let users;
        try {
            console.log('Executing query: SELECT * FROM users WHERE email = ?', [email]);
            [users] = await pool.query(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );
            console.log('Query result:', users.length > 0 ? 'User found' : 'User not found');
        } catch (dbError) {
            console.error('Database error during login:', dbError);
            return res.status(500).json({
                message: 'Database error during login',
                error: dbError.message,
                code: dbError.code
            });
        }

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = users[0];
        console.log('User found:', { id: user.id, email: user.email, role: user.role });

        // Check if password exists in the database record
        if (!user.password) {
            console.error('User record has no password field');
            return res.status(500).json({ message: 'Invalid user data' });
        }

        // Check password with error handling
        let validPassword;
        try {
            console.log('Comparing password...');
            validPassword = await bcrypt.compare(password, user.password);
            console.log('Password validation result:', validPassword);
        } catch (bcryptError) {
            console.error('Bcrypt error during login:', bcryptError);
            return res.status(500).json({
                message: 'Error validating password',
                error: bcryptError.message
            });
        }

        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate JWT token
        let token;
        try {
            token = jwt.sign(
                {
                    id: user.id,
                    role: user.role
                },
                process.env.JWT_SECRET || 'your_jwt_secret',
                { expiresIn: '24h' }
            );
        } catch (jwtError) {
            console.error('JWT error during login:', jwtError);
            return res.status(500).json({
                message: 'Error generating authentication token',
                error: jwtError.message
            });
        }

        console.log('Login successful for:', email);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Unexpected login error:', error);
        res.status(500).json({
            message: 'Login failed',
            error: error.message,
            stack: error.stack
        });
    }
});

// Add a test endpoint for database connections
app.get('/api/test/db-connection', async (req, res) => {
    try {
        // Test the database connection
        const [result] = await pool.query('SELECT 1 as connection_test');

        // Test users table
        const [users] = await pool.query('SELECT COUNT(*) as count FROM users');

        res.json({
            success: true,
            connection: result[0].connection_test === 1 ? 'success' : 'failed',
            tables: {
                users: users[0].count
            },
            message: 'Database connection test successful'
        });
    } catch (error) {
        console.error('Database test error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack,
            message: 'Database connection test failed'
        });
    }
});

// Add a test login endpoint for troubleshooting
app.post('/api/test/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Test login attempt for:', email);

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        // Check users table
        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        res.json({
            success: true,
            foundInUsers: users.length > 0,
            usersCount: users.length,
            message: 'Login test results'
        });
    } catch (error) {
        console.error('Test login error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack,
            message: 'Login test failed'
        });
    }
});

// Add a simple ping route for connection testing
app.get('/api/ping', (req, res) => {
    res.json({
        message: 'Server is reachable',
        timestamp: new Date().toISOString()
    });
});

// Development login route (NOT FOR PRODUCTION)
app.post('/api/auth/dev-login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Development login attempt for:', email);

        // Find user in users table
        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        console.log('Found users:', users.length);

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = users[0];
        console.log('User details:', {
            id: user.id,
            email: user.email,
            role: user.role,
            passwordExists: !!user.password,
            passwordLength: user.password ? user.password.length : 0
        });

        // In dev mode, accept direct password match or bcrypt
        let validPassword = false;

        // Try direct comparison first (for development only)
        if (password === user.password) {
            console.log('Direct password match');
            validPassword = true;
        } else {
            // Try bcrypt comparison
            try {
                console.log('Trying bcrypt comparison');
                validPassword = await bcrypt.compare(password, user.password);
                console.log('Bcrypt result:', validPassword);
            } catch (err) {
                console.error('Bcrypt compare error:', err);
                // Continue with validPassword = false
            }
        }

        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate token
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful (dev mode)',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Development login error:', error);
        res.status(500).json({
            message: 'Login failed',
            error: error.message,
            stack: error.stack
        });
    }
});

// Development password reset route (NOT FOR PRODUCTION)
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        console.log('Password reset attempt for:', email);

        if (!email || !newPassword) {
            return res.status(400).json({ message: 'Email and new password are required' });
        }

        // Find the user
        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password
        await pool.query(
            'UPDATE users SET password = ? WHERE email = ?',
            [hashedPassword, email]
        );

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ message: 'Password reset failed', error: error.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
    });
});

// Initialize socket.io
initializeSocket(server);

const PORT = process.env.PORT || 5000;

// Function to test database connection
const testDatabaseConnection = async () => {
    try {
        await pool.query('SELECT 1');
        console.log('Database connected successfully');
        return true;
    } catch (error) {
        console.error('Database connection failed:', error);
        return false;
    }
};

// Start server only if database connection is successful
const startServer = async () => {
    try {
        const isConnected = await testDatabaseConnection();
        if (!isConnected) {
            console.error('Could not connect to database. Server will not start.');
            process.exit(1);
        }

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
};

startServer(); 