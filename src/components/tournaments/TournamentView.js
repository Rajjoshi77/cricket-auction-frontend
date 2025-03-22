import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Button,
    Box,
    Grid,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Chip
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const TournamentView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [openRegisterDialog, setOpenRegisterDialog] = useState(false);
    const [registrationError, setRegistrationError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Define API URL with fallback
    const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;

    useEffect(() => {
        const fetchTournament = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(
                    `${API_URL}/tournaments/${id}`,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                setTournament(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching tournament:', err);
                setError(err.response?.data?.message || 'Failed to fetch tournament details');
                setLoading(false);
            }
        };

        fetchTournament();
    }, [id, API_URL]);

    const handleRegisterTeam = async () => {
        try {
            setRegistrationError('');
            const token = localStorage.getItem('token');

            // First check if user has a team
            const teamResponse = await axios.get(
                `${API_URL}/teams/my-team`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (!teamResponse.data || !teamResponse.data.team_id) {
                setRegistrationError('You need to create a team first before registering for a tournament');
                return;
            }

            // Register the team
            await axios.post(
                `${API_URL}/tournaments/${id}/register`,
                {
                    team_id: teamResponse.data.team_id,
                    total_budget: tournament.base_budget_per_team
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setOpenRegisterDialog(false);
            setSuccessMessage('Team registered successfully!');
            // Refresh tournament data
            const tournamentResponse = await axios.get(
                `${API_URL}/tournaments/${id}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setTournament(tournamentResponse.data);
        } catch (err) {
            console.error('Error registering team:', err);
            setRegistrationError(err.response?.data?.message || 'Failed to register team');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!tournament) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Alert severity="error">Tournament not found</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {successMessage && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
                    {successMessage}
                </Alert>
            )}

            <Paper sx={{ p: 4, borderRadius: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h4" component="h1">
                        {tournament.tournament_name}
                    </Typography>
                    <Chip
                        label={tournament.status}
                        color={tournament.status === 'upcoming' ? 'primary' : tournament.status === 'active' ? 'success' : 'default'}
                    />
                </Box>

                <Grid container spacing={4}>
                    <Grid item xs={12} md={8}>
                        <Typography variant="h6" gutterBottom>
                            Tournament Details
                        </Typography>
                        <Box sx={{ mb: 3 }}>
                            <Typography><strong>Season Year:</strong> {tournament.season_year}</Typography>
                            <Typography><strong>Start Date:</strong> {formatDate(tournament.start_date)}</Typography>
                            <Typography><strong>End Date:</strong> {formatDate(tournament.end_date)}</Typography>
                            <Typography><strong>Registration Deadline:</strong> {formatDate(tournament.registration_deadline)}</Typography>
                            <Typography><strong>Venue:</strong> {tournament.venue}</Typography>
                            <Typography><strong>Description:</strong> {tournament.description}</Typography>
                        </Box>

                        <Typography variant="h6" gutterBottom>
                            Team Requirements
                        </Typography>
                        <Box>
                            <Typography><strong>Maximum Teams:</strong> {tournament.max_teams}</Typography>
                            <Typography><strong>Players per Team:</strong> {tournament.min_players_per_team} - {tournament.max_players_per_team}</Typography>
                            <Typography><strong>Base Budget per Team:</strong> {formatCurrency(tournament.base_budget_per_team)}</Typography>
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 3, bgcolor: 'background.default' }}>
                            <Typography variant="h6" gutterBottom>
                                Registration Status
                            </Typography>
                            <Box sx={{ mb: 3 }}>
                                <Typography><strong>Registered Teams:</strong> {tournament.registered_teams_count || 0}/{tournament.max_teams}</Typography>
                                <Typography><strong>Registration Deadline:</strong> {formatDate(tournament.registration_deadline)}</Typography>
                            </Box>

                            {user.role === 'team_owner' && tournament.status === 'upcoming' && (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    onClick={() => setOpenRegisterDialog(true)}
                                >
                                    Register Team
                                </Button>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </Paper>

            {/* Registration Dialog */}
            <Dialog open={openRegisterDialog} onClose={() => setOpenRegisterDialog(false)}>
                <DialogTitle>Register for Tournament</DialogTitle>
                <DialogContent>
                    {registrationError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {registrationError}
                        </Alert>
                    )}
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Are you sure you want to register your team for {tournament.tournament_name}?
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Base budget per team: {formatCurrency(tournament.base_budget_per_team)}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenRegisterDialog(false)}>Cancel</Button>
                    <Button onClick={handleRegisterTeam} color="primary" variant="contained">
                        Register
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default TournamentView;