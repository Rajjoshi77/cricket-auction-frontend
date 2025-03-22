import React, { useState } from 'react';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Alert,
    Box,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    Divider
} from '@mui/material';
import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;

const LoginTest = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [dbTest, setDbTest] = useState(null);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const testDatabaseConnection = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/test/db-connection`);
            setDbTest(response.data);
        } catch (err) {
            console.error('Database test error:', err);
            setError('Database connection test failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setResult(null);
        setLoading(true);

        try {
            const response = await axios.post(`${API_URL}/test/login`, formData);
            setResult(response.data);
        } catch (err) {
            console.error('Login test error:', err);
            setError('Login test failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const tryDirectLogin = async () => {
        try {
            setLoading(true);
            const response = await axios.post(`${API_URL}/auth/login`, formData);
            setResult({
                success: true,
                message: 'Direct login successful',
                token: response.data.token ? 'Token received' : 'No token',
                user: response.data.user ? JSON.stringify(response.data.user) : 'No user data'
            });
        } catch (err) {
            console.error('Direct login error:', err);
            setError('Direct login failed: ' + (err.response?.data?.message || err.message));
            setResult({
                success: false,
                error: err.response?.data || err.message,
                status: err.response?.status
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="md">
            <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
                <Typography variant="h4" gutterBottom align="center">
                    Login Diagnostics Tool
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ mb: 4 }}>
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={testDatabaseConnection}
                        disabled={loading}
                        fullWidth
                    >
                        {loading ? <CircularProgress size={24} /> : 'Test Database Connection'}
                    </Button>
                </Box>

                {dbTest && (
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6">Database Test Results:</Typography>
                        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
                            {JSON.stringify(dbTest, null, 2)}
                        </pre>
                    </Box>
                )}

                <Divider sx={{ my: 3 }} />

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

                    <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Test Login'}
                        </Button>

                        <Button
                            variant="contained"
                            color="warning"
                            fullWidth
                            disabled={loading}
                            onClick={tryDirectLogin}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Try Direct Login'}
                        </Button>
                    </Box>
                </form>

                {result && (
                    <Box sx={{ mt: 4 }}>
                        <Typography variant="h6">Test Results:</Typography>
                        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </Box>
                )}
            </Paper>
        </Container>
    );
};

export default LoginTest;