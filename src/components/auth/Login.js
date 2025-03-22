import React, { useState } from 'react';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Alert,
    Box,
    CircularProgress
} from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Add API URL constant
const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            console.log('Attempting login with:', { email: formData.email });

            // First try the regular login endpoint
            let response;
            try {
                response = await axios.post(`${API_URL}/auth/login`, formData, {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                });
                console.log('Regular login successful');
            } catch (regularLoginError) {
                console.log('Regular login failed, trying development login');
                // If regular login fails, try the development login endpoint
                response = await axios.post(`${API_URL}/auth/dev-login`, formData, {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                });
                console.log('Development login successful');
            }

            if (!response.data.token || !response.data.user) {
                throw new Error('Invalid response from server');
            }

            // Store token and user data
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            console.log('Login successful:', {
                id: response.data.user.id,
                username: response.data.user.username,
                role: response.data.user.role
            });

            // Redirect to dashboard and reload the page to ensure navbar updates
            navigate('/dashboard');
            window.location.reload(); // Force a page reload to update the navbar
        } catch (err) {
            console.error('Login error details:', {
                message: err.message,
                status: err.response?.status,
                statusText: err.response?.statusText,
                responseData: err.response?.data,
                isNetworkError: err.isAxiosError && !err.response,
                config: err.config ? {
                    url: err.config.url,
                    method: err.config.method
                } : null
            });

            if (err.isAxiosError && !err.response) {
                // Network error occurred
                setError('Network error: Cannot connect to the server. Please check if the server is running.');
            } else {
                setError(
                    err.response?.data?.message ||
                    err.response?.data?.error ||
                    err.message ||
                    'Login failed'
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm">
            <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
                <Typography variant="h4" gutterBottom align="center">
                    Login
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        margin="normal"
                        required
                        disabled={loading}
                    />

                    <TextField
                        fullWidth
                        label="Password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        margin="normal"
                        required
                        disabled={loading}
                    />

                    <Box sx={{ mt: 3 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Login'}
                        </Button>
                    </Box>

                    <Box sx={{ mt: 2 }}>
                        <Button
                            variant="text"
                            fullWidth
                            onClick={() => navigate('/register')}
                            disabled={loading}
                        >
                            Don't have an account? Register
                        </Button>
                    </Box>
                </form>
            </Paper>
        </Container>
    );
};

export default Login;