const jwt = require('jsonwebtoken');
const pool = require('../config/db.config');

// Middleware to authenticate JWT token
exports.authenticateToken = (req, res, next) => {
    console.log('Authenticating token...');

    // Get auth header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log('Auth header:', authHeader);
    console.log('Token:', token ? token.substring(0, 15) + '...' : 'No token');

    if (!token) {
        console.log('No token provided');
        return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
        if (err) {
            console.error('Token verification failed:', err);
            return res.status(403).json({ message: 'Invalid or expired token' });
        }

        console.log('Token verified successfully for user:', user);
        req.user = user;
        next();
    });
};

// Middleware to check if user is admin
exports.isAdmin = (req, res, next) => {
    console.log('Checking admin rights for user:', req.user);

    if (req.user.role !== 'admin') {
        console.log('Access denied: User is not an admin');
        return res.status(403).json({ message: 'Access denied: Admin rights required' });
    }

    console.log('Admin access granted');
    next();
}; 