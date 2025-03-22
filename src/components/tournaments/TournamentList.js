import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Button,
    TextField,
    MenuItem,
    Box,
    Card,
    CardContent,
    CardActions,
    CircularProgress,
    Alert,
    Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const TournamentList = () => {
    const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [tournaments, setTournaments] = useState([]);
    const [filteredTournaments, setFilteredTournaments] = useState([]);
    const [filter, setFilter] = useState({
        status: 'all',
        search: ''
    });

    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                console.log('Fetching tournaments from API...');
                const config = {
                    headers: { Authorization: `Bearer ${token}` }
                };
                console.log('API URL:', `${API_URL}/tournaments`);
                console.log('Auth token:', token);
                const response = await axios.get(`${API_URL}/tournaments`, config);
                console.log('Tournaments data received:', response.data);
                setTournaments(response.data);
                setFilteredTournaments(response.data);
            } catch (error) {
                console.error('Error fetching tournaments:', error);
                console.error('Error details:', error.response || error.message);
                setError(error.response?.data?.message || 'Error fetching tournaments. Please check the console for details.');
            } finally {
                setLoading(false);
            }
        };

        fetchTournaments();
    }, [token, API_URL]);

    useEffect(() => {
        let result = [...tournaments];

        // Apply status filter
        if (filter.status !== 'all') {
            result = result.filter(tournament => tournament.status === filter.status);
        }

        // Apply search filter
        if (filter.search) {
            result = result.filter(tournament =>
                tournament.tournament_name.toLowerCase().includes(filter.search.toLowerCase())
            );
        }

        setFilteredTournaments(result);
    }, [filter, tournaments]);

    const handleFilterChange = (event) => {
        setFilter({
            ...filter,
            [event.target.name]: event.target.value
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'upcoming':
                return 'info';
            case 'active':
                return 'success';
            case 'completed':
                return 'default';
            default:
                return 'default';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Box sx={{ mb: 4 }}>
                <Grid container spacing={2} alignItems="center" justifyContent="space-between">
                    <Grid item xs={12} md={8}>
                        <Typography variant="h4" component="h1" gutterBottom>
                            Tournaments
                        </Typography>
                    </Grid>
                    {user.role === 'admin' && (
                        <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => navigate('/tournaments/create')}
                            >
                                Create Tournament
                            </Button>
                        </Grid>
                    )}
                </Grid>
            </Box>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Search Tournaments"
                            name="search"
                            value={filter.search}
                            onChange={handleFilterChange}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            select
                            label="Status"
                            name="status"
                            value={filter.status}
                            onChange={handleFilterChange}
                        >
                            <MenuItem value="all">All</MenuItem>
                            <MenuItem value="upcoming">Upcoming</MenuItem>
                            <MenuItem value="active">Active</MenuItem>
                            <MenuItem value="completed">Completed</MenuItem>
                        </TextField>
                    </Grid>
                </Grid>
            </Paper>

            <Grid container spacing={2}>
                {filteredTournaments.map((tournament) => (
                    <Grid item xs={12} md={6} key={tournament.id || tournament.tournament_id}>
                        <Card
                            sx={{
                                cursor: 'pointer',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: 4
                                }
                            }}
                            onClick={() => navigate(`/tournaments/${tournament.id || tournament.tournament_id}`)}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography variant="h6" component="h2">
                                        {tournament.tournament_name}
                                    </Typography>
                                    <Chip
                                        label={tournament.status}
                                        color={getStatusColor(tournament.status)}
                                        size="small"
                                    />
                                </Box>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography color="textSecondary">
                                            Start Date
                                        </Typography>
                                        <Typography variant="body2">
                                            {formatDate(tournament.start_date)}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography color="textSecondary">
                                            End Date
                                        </Typography>
                                        <Typography variant="body2">
                                            {formatDate(tournament.end_date)}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography color="textSecondary">
                                            Teams
                                        </Typography>
                                        <Typography variant="body2">
                                            {tournament.registered_teams || 0}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography color="textSecondary">
                                            Matches
                                        </Typography>
                                        <Typography variant="body2">
                                            {tournament.total_matches || 0}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </CardContent>
                            <CardActions>
                                <Button
                                    size="small"
                                    color="primary"
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent card click from triggering
                                        navigate(`/tournaments/${tournament.id || tournament.tournament_id}`);
                                    }}
                                >
                                    View Details
                                </Button>
                                {tournament.status === 'upcoming' && user.role === 'team_owner' && (
                                    <Button
                                        size="small"
                                        color="secondary"
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent card click from triggering
                                            navigate(`/tournaments/${tournament.id || tournament.tournament_id}/register`);
                                        }}
                                    >
                                        Register Team
                                    </Button>
                                )}
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {filteredTournaments.length === 0 && (
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body1" color="textSecondary">
                        No tournaments found matching your criteria.
                    </Typography>
                </Paper>
            )}
        </Container>
    );
};

export default TournamentList;