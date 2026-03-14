const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        res.status(400).json({ message: 'Invalid token.' });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admin rights required.' });
    }
};

const isTeamOwner = (req, res, next) => {
    if (req.user && req.user.role === 'team_owner') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Team owner rights required.' });
    }
};

module.exports = {
    authenticateToken,
    isAdmin,
    isTeamOwner
}; 