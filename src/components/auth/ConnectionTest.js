import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Button,
    Alert,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    Divider,
    TextField,
} from '@mui/material';
import axios from 'axios';

// Add API URL constant
const DEFAULT_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ConnectionTest = () => {
    const [pingResult, setPingResult] = useState(null);
    const [dbTestResult, setDbTestResult] = useState(null);
    const [loginTestResult, setLoginTestResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [customUrl, setCustomUrl] = useState(DEFAULT_API_URL);
    const [testCredentials, setTestCredentials] = useState({
        email: '',
        password: ''
    });

    const handleCredentialChange = (e) => {
        setTestCredentials({
            ...testCredentials,
            [e.target.name]: e.target.value
        });
    };

    const handleUrlChange = (e) => {
        setCustomUrl(e.target.value);
    };

    const testPing = async () => {
        try {
            setLoading(true);
            setError('');
            console.log(`Testing connection to ${customUrl}/api/ping`);
            const startTime = new Date().getTime();
            const response = await axios.get(`${customUrl}/api/ping`, { timeout: 5000 });
            const endTime = new Date().getTime();
            setPingResult({
                success: true,
                data: response.data,
                latency: endTime - startTime
            });
        } catch (err) {
            console.error('Ping error:', err);
            setPingResult({
                success: false,
                error: err.message,
                isNetworkError: err.isAxiosError && !err.response
            });
            setError(`Connection failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const testDatabase = async () => {
        try {
            setLoading(true);
            setError('');
            console.log(`Testing database connection via ${customUrl}/api/test/db-connection`);
            const response = await axios.get(`${customUrl}/api/test/db-connection`, { timeout: 5000 });
            setDbTestResult({
                success: true,
                data: response.data
            });
        } catch (err) {
            console.error('Database test error:', err);
            setDbTestResult({
                success: false,
                error: err.message,
                isNetworkError: err.isAxiosError && !err.response
            });
            setError(`Database test failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const testLogin = async () => {
        try {
            setLoading(true);
            setError('');

            if (!testCredentials.email || !testCredentials.password) {
                setError('Please enter email and password for login test');
                setLoading(false);
                return;
            }

            console.log(`Testing login via ${customUrl}/api/test/login`);
            const response = await axios.post(
                `${customUrl}/api/test/login`,
                testCredentials,
                { timeout: 5000 }
            );

            setLoginTestResult({
                success: true,
                data: response.data
            });
        } catch (err) {
            console.error('Login test error:', err);
            setLoginTestResult({
                success: false,
                error: err.message,
                isNetworkError: err.isAxiosError && !err.response,
                responseData: err.response?.data
            });
            setError(`Login test failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Run ping test on component mount
    useEffect(() => {
        testPing();
    }, []);

    return (
        <Container maxWidth="md">
            <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
                <Typography variant="h4" gutterBottom align="center">
                    Backend Connection Diagnostics
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ mb: 3 }}>
                    <TextField
                        fullWidth
                        label="Backend URL"
                        value={customUrl}
                        onChange={handleUrlChange}
                        margin="normal"
                        variant="outlined"
                    />
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={testPing}
                        disabled={loading}
                        fullWidth
                    >
                        {loading ? <CircularProgress size={24} /> : 'Test Connection'}
                    </Button>
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={testDatabase}
                        disabled={loading}
                        fullWidth
                    >
                        {loading ? <CircularProgress size={24} /> : 'Test Database'}
                    </Button>
                </Box>

                {pingResult && (
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6">Connection Test Results:</Typography>
                        <Paper sx={{ p: 2, bgcolor: pingResult.success ? '#e8f5e9' : '#ffebee' }}>
                            <Typography variant="body1">
                                Status: {pingResult.success ? 'Success' : 'Failed'}
                            </Typography>
                            {pingResult.success && (
                                <>
                                    <Typography variant="body1">
                                        Latency: {pingResult.latency}ms
                                    </Typography>
                                    <Typography variant="body1">
                                        Server Time: {pingResult.data.timestamp}
                                    </Typography>
                                </>
                            )}
                            {!pingResult.success && (
                                <Typography variant="body1" color="error">
                                    Error: {pingResult.error}
                                </Typography>
                            )}
                        </Paper>
                    </Box>
                )}

                {dbTestResult && (
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6">Database Test Results:</Typography>
                        <pre style={{
                            background: dbTestResult.success ? '#e8f5e9' : '#ffebee',
                            padding: '10px',
                            borderRadius: '4px',
                            overflow: 'auto'
                        }}>
                            {JSON.stringify(dbTestResult.data || dbTestResult.error, null, 2)}
                        </pre>
                    </Box>
                )}

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                    Test Login Credentials
                </Typography>

                <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={testCredentials.email}
                    onChange={handleCredentialChange}
                    margin="normal"
                    required
                    disabled={loading}
                />

                <TextField
                    fullWidth
                    label="Password"
                    name="password"
                    type="password"
                    value={testCredentials.password}
                    onChange={handleCredentialChange}
                    margin="normal"
                    required
                    disabled={loading}
                />

                <Box sx={{ mt: 2, mb: 4 }}>
                    <Button
                        variant="contained"
                        color="warning"
                        onClick={testLogin}
                        disabled={loading || !testCredentials.email || !testCredentials.password}
                        fullWidth
                    >
                        {loading ? <CircularProgress size={24} /> : 'Test Login Credentials'}
                    </Button>
                </Box>

                {loginTestResult && (
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6">Login Test Results:</Typography>
                        <pre style={{
                            background: loginTestResult.success ? '#e8f5e9' : '#ffebee',
                            padding: '10px',
                            borderRadius: '4px',
                            overflow: 'auto'
                        }}>
                            {JSON.stringify(loginTestResult.data || loginTestResult.error, null, 2)}
                        </pre>
                    </Box>
                )}
            </Paper>
        </Container>
    );
};

export default ConnectionTest;