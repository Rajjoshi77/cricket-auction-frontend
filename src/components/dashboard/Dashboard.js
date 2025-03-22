import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Button,
    Box,
    Grid,
    Card,
    CardContent,
    Divider,
    CircularProgress,
    Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Add API URL constant
const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_URL}/dashboard/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(response.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Error fetching dashboard statistics');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardStats();
    }, []);

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/auth/logout`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
        }
    };

    const AdminActions = () => (
        <Box mt={4}>
            <Typography variant="h5" gutterBottom>
                Admin Actions
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Tournament Management
                            </Typography>
                            <Button
                                variant="contained"
                                color="primary"
                                fullWidth
                                onClick={() => navigate('/tournaments/create')}
                                sx={{ mb: 1 }}
                            >
                                Create Tournament
                            </Button>
                            <Button
                                variant="outlined"
                                color="primary"
                                fullWidth
                                onClick={() => navigate('/tournaments')}
                            >
                                View All Tournaments
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Player Management
                            </Typography>
                            <Button
                                variant="contained"
                                color="primary"
                                fullWidth
                                onClick={() => navigate('/players/create')}
                                sx={{ mb: 1 }}
                            >
                                Add New Player
                            </Button>
                            <Button
                                variant="outlined"
                                color="primary"
                                fullWidth
                                onClick={() => navigate('/players')}
                            >
                                Manage Players
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Auction Management
                            </Typography>
                            <Button
                                variant="contained"
                                color="primary"
                                fullWidth
                                onClick={() => navigate('/auctions/create')}
                                sx={{ mb: 1 }}
                            >
                                Create Auction
                            </Button>
                            <Button
                                variant="outlined"
                                color="primary"
                                fullWidth
                                onClick={() => navigate('/auctions')}
                            >
                                View All Auctions
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );

    const TeamOwnerActions = () => (
        <Box mt={4}>
            <Typography variant="h5" gutterBottom>
                Team Owner Actions
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                My Team
                            </Typography>
                            <Button
                                variant="contained"
                                color="primary"
                                fullWidth
                                onClick={() => navigate('/teams/' + user.id)}
                                sx={{ mb: 1 }}
                            >
                                View My Team
                            </Button>
                            <Button
                                variant="outlined"
                                color="primary"
                                fullWidth
                                onClick={() => navigate('/players')}
                            >
                                View My Players
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Auctions
                            </Typography>
                            <Button
                                variant="contained"
                                color="primary"
                                fullWidth
                                onClick={() => navigate('/auctions')}
                            >
                                View Active Auctions
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Tournaments
                            </Typography>
                            <Button
                                variant="contained"
                                color="primary"
                                fullWidth
                                onClick={() => navigate('/tournaments')}
                            >
                                View Tournaments
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );

    if (loading) {
        return (
            <Container maxWidth="lg">
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                    <Typography variant="h4">
                        Welcome, {user?.username}!
                    </Typography>
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={handleLogout}
                    >
                        Logout
                    </Button>
                </Box>

                <Typography variant="h6" gutterBottom>
                    Role: {user?.role === 'admin' ? 'Administrator' : 'Team Owner'}
                </Typography>

                {stats && (
                    <Box mt={3} mb={3}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <Card>
                                    <CardContent>
                                        <Typography color="textSecondary" gutterBottom>
                                            Active Auctions
                                        </Typography>
                                        <Typography variant="h3">
                                            {stats.activeAuctions}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Card>
                                    <CardContent>
                                        <Typography color="textSecondary" gutterBottom>
                                            Total Players
                                        </Typography>
                                        <Typography variant="h3">
                                            {stats.totalPlayers}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Card>
                                    <CardContent>
                                        <Typography color="textSecondary" gutterBottom>
                                            Active Tournaments
                                        </Typography>
                                        <Typography variant="h3">
                                            {stats.activeTournaments}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Box>
                )}

                <Divider sx={{ my: 3 }} />

                {user?.role === 'admin' ? <AdminActions /> : <TeamOwnerActions />}
            </Paper>
        </Container>
    );
};

export default Dashboard;