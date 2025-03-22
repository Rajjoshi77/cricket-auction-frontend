import React, { useState } from 'react';
import {
    Container,
    Grid,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    Alert,
    CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import axios from 'axios';

const TournamentEdit = () => {
    const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        tournament_name: '',
        season_year: new Date().getFullYear(),
        start_date: new Date(),
        end_date: new Date(),
        registration_deadline: new Date(),
        max_teams: 8,
        min_players_per_team: 15,
        max_players_per_team: 25,
        base_budget_per_team: 1000000,
        venue: '',
        description: '',
        status: 'upcoming'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDateChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Authentication required. Please log in.');
                return;
            }

            // Format dates to ISO string
            const submitData = {
                ...formData,
                start_date: formData.start_date.toISOString().split('T')[0],
                end_date: formData.end_date.toISOString().split('T')[0],
                registration_deadline: formData.registration_deadline.toISOString().split('T')[0],
                base_budget_per_team: Number(formData.base_budget_per_team),
                max_teams: Number(formData.max_teams),
                min_players_per_team: Number(formData.min_players_per_team),
                max_players_per_team: Number(formData.max_players_per_team),
                season_year: Number(formData.season_year)
            };

            console.log('Submitting tournament data:', submitData);

            const response = await axios.post(
                `${API_URL}/tournaments`,
                submitData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Tournament created:', response.data);
            setSuccess('Tournament created successfully!');
            setTimeout(() => {
                navigate('/tournaments');
            }, 2000);
        } catch (error) {
            console.error('Error saving tournament:', error);
            setError(error.response?.data?.message || 'Error creating tournament. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="md">
            <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Create Tournament
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {success}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Tournament Name"
                                name="tournament_name"
                                value={formData.tournament_name}
                                onChange={handleChange}
                                required
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Season Year"
                                name="season_year"
                                type="number"
                                value={formData.season_year}
                                onChange={handleChange}
                                required
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker
                                    label="Start Date"
                                    value={formData.start_date}
                                    onChange={(newValue) => handleDateChange('start_date', newValue)}
                                    renderInput={(params) => <TextField {...params} fullWidth required />}
                                />
                            </LocalizationProvider>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker
                                    label="End Date"
                                    value={formData.end_date}
                                    onChange={(newValue) => handleDateChange('end_date', newValue)}
                                    renderInput={(params) => <TextField {...params} fullWidth required />}
                                />
                            </LocalizationProvider>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker
                                    label="Registration Deadline"
                                    value={formData.registration_deadline}
                                    onChange={(newValue) => handleDateChange('registration_deadline', newValue)}
                                    renderInput={(params) => <TextField {...params} fullWidth required />}
                                />
                            </LocalizationProvider>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Maximum Teams"
                                name="max_teams"
                                type="number"
                                value={formData.max_teams}
                                onChange={handleChange}
                                required
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Minimum Players per Team"
                                name="min_players_per_team"
                                type="number"
                                value={formData.min_players_per_team}
                                onChange={handleChange}
                                required
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Maximum Players per Team"
                                name="max_players_per_team"
                                type="number"
                                value={formData.max_players_per_team}
                                onChange={handleChange}
                                required
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Base Budget per Team"
                                name="base_budget_per_team"
                                type="number"
                                value={formData.base_budget_per_team}
                                onChange={handleChange}
                                required
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Venue"
                                name="venue"
                                value={formData.venue}
                                onChange={handleChange}
                                required
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                multiline
                                rows={4}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Box display="flex" justifyContent="flex-end" gap={2}>
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate('/tournaments')}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    disabled={loading}
                                >
                                    {loading ? 'Creating...' : 'Create Tournament'}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Container>
    );
};

export default TournamentEdit;