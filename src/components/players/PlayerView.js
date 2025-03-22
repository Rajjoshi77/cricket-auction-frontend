import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Chip,
    Alert,
    CircularProgress,
    Button,
    Avatar,
    Divider
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PlayerStats from './PlayerStats';

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;

const PlayerView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [player, setPlayer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPlayer = async () => {
            try {
                setLoading(true);
                setError('');
                const token = localStorage.getItem('token');

                if (!token) {
                    setError('Authentication token not found. Please login again.');
                    return;
                }

                console.log('Fetching player with ID:', id);
                console.log('Using token:', token);

                const response = await axios.get(
                    `${API_URL}/players/${id}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        }
                    }
                );

                console.log('API Response:', response);

                if (response.data) {
                    setPlayer(response.data);
                } else {
                    setError('No data received from server');
                }
            } catch (err) {
                console.error('Full error object:', err);
                console.error('Error response:', err.response);
                console.error('Error message:', err.message);

                if (err.response?.status === 401) {
                    setError('Session expired. Please login again.');
                    navigate('/login');
                } else if (err.response?.status === 404) {
                    setError('Player not found');
                } else if (err.response?.data?.message) {
                    setError(err.response.data.message);
                } else if (err.message.includes('Network Error')) {
                    setError('Unable to connect to server. Please check if the server is running.');
                } else {
                    setError('An unexpected error occurred. Please try again later.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchPlayer();
    }, [id, navigate]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg">
                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="80vh">
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                    <Button variant="contained" onClick={() => navigate('/players')}>
                        Back to Players List
                    </Button>
                </Box>
            </Container>
        );
    }

    if (!player) {
        return (
            <Container maxWidth="lg">
                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="80vh">
                    <Alert severity="info">
                        Player not found
                    </Alert>
                    <Button variant="contained" onClick={() => navigate('/players')} sx={{ mt: 2 }}>
                        Back to Players List
                    </Button>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                {/* Player Profile Card */}
                <Card sx={{ mb: 4, borderRadius: 2, boxShadow: 3 }}>
                    <CardContent>
                        <Grid container spacing={3} alignItems="center">
                            <Grid item xs={12} md={3}>
                                <Box display="flex" justifyContent="center">
                                    <Avatar
                                        src={player.profile_image_url}
                                        alt={`${player.first_name} ${player.last_name}`}
                                        sx={{
                                            width: 200,
                                            height: 200,
                                            border: '3px solid #1976d2'
                                        }}
                                    />
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={9}>
                                <Typography variant="h4" gutterBottom>
                                    {player.first_name} {player.last_name}
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle1" color="textSecondary">
                                            Role
                                        </Typography>
                                        <Typography variant="body1" gutterBottom>
                                            {player.role}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle1" color="textSecondary">
                                            Specialization
                                        </Typography>
                                        <Typography variant="body1" gutterBottom>
                                            {player.specialization}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle1" color="textSecondary">
                                            Country
                                        </Typography>
                                        <Typography variant="body1" gutterBottom>
                                            {player.country}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle1" color="textSecondary">
                                            Age
                                        </Typography>
                                        <Typography variant="body1" gutterBottom>
                                            {player.age} years
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle1" color="textSecondary">
                                            Base Price
                                        </Typography>
                                        <Typography variant="body1" gutterBottom>
                                            ₹{player.base_price?.toLocaleString() || 'N/A'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle1" color="textSecondary">
                                            Status
                                        </Typography>
                                        <Typography
                                            variant="body1"
                                            color={player.status === 'available' ? 'success.main' : 'error.main'}
                                        >
                                            {player.status}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                <Divider sx={{ my: 4 }} />

                {/* Player Statistics */}
                <PlayerStats playerId={id} />
            </Box>
        </Container>
    );
};

export default PlayerView;