const jwt = require('jsonwebtoken');

// Sample token (replace with an actual token from your browser's localStorage)
const sampleToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzEwMzM2NTQ4LCJleHAiOjE3MTAzMzY1NDh9.XYZ';

// JWT secret (must match the one used in your server)
const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret';

console.log('Testing JWT token validation...');
console.log('JWT Secret:', jwtSecret);

try {
    // Verify the token
    const decoded = jwt.verify(sampleToken, jwtSecret);
    console.log('Token is valid!');
    console.log('Decoded token:', decoded);
} catch (error) {
    console.error('Token validation failed:', error.message);
}

// Generate a new token for testing
const newToken = jwt.sign(
    { id: 999, role: 'admin' },
    jwtSecret,
    { expiresIn: '1h' }
);

console.log('\nGenerated new test token:');
console.log(newToken);

// Verify the new token
try {
    const decoded = jwt.verify(newToken, jwtSecret);
    console.log('New token is valid!');
    console.log('Decoded new token:', decoded);
} catch (error) {
    console.error('New token validation failed:', error.message);
} 