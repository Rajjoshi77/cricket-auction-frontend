import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    CircularProgress,
    Autocomplete,
    Chip,
    InputAdornment
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;

const AuctionEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [tournaments, setTournaments] = useState([]);
    const [availablePlayers, setAvailablePlayers] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        tournament_id: '',
        start_time: new Date(),
        end_time: new Date(),
        min_purse: 1000000,
        status: 'upcoming',
        players: []
    });

    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) {
            setError('Authentication required. Please log in.');
            navigate('/login');
            return;
        }
        fetchInitialData();
    }, [id]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            };

            // Fetch tournaments and players in parallel
            const [tournamentsRes, playersRes] = await Promise.all([
                axios.get(`${API_URL}/tournaments`, config),
                axios.get(`${API_URL}/players`, config)
            ]);

            setTournaments(tournamentsRes.data);
            console.log('Fetched players:', playersRes.data);
            setAvailablePlayers(playersRes.data.filter(player => !player.current_team_id));

            // If editing existing auction, fetch its data
            if (id) {
                const auctionRes = await axios.get(`${API_URL}/auctions/${id}`, config);
                const auction = auctionRes.data;
                setFormData({
                    ...auction,
                    start_time: new Date(auction.start_time),
                    end_time: new Date(auction.end_time),
                    players: auction.players || []
                });
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            if (error.response?.status === 403) {
                setError('You do not have permission to access this resource');
                navigate('/login');
            } else if (error.code === 'ERR_NETWORK') {
                setError('Unable to connect to the server. Please check if the server is running.');
            } else {
                setError(error.response?.data?.message || 'Error fetching data');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDateChange = (name) => (date) => {
        if (!date || isNaN(date.getTime())) {
            console.error('Invalid date:', date);
            return;
        }
        setFormData(prev => ({
            ...prev,
            [name]: date
        }));
    };

    const handlePlayersChange = (event, newValue) => {
        setFormData(prev => ({
            ...prev,
            players: newValue
        }));
    };

    const validateForm = () => {
        if (!formData.name?.trim()) return 'Auction name is required';
        if (!formData.tournament_id) return 'Tournament is required';
        if (!formData.start_time) return 'Start time is required';
        if (!formData.end_time) return 'End time is required';

        const now = new Date();
        const startTime = new Date(formData.start_time);
        const endTime = new Date(formData.end_time);

        if (startTime < now) {
            return 'Start time must be in the future';
        }
        if (endTime <= startTime) {
            return 'End time must be after start time';
        }
        if (!formData.min_purse || formData.min_purse < 1000000) {
            return 'Minimum purse must be at least ₹10,00,000';
        }
        if (!formData.players?.length) {
            return 'At least one player must be selected';
        }
        return null;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        if (!token) {
            setError('Authentication required. Please log in.');
            navigate('/login');
            return;
        }

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setLoading(true);
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            };

            // Format dates to ISO string
            const submitData = {
                ...formData,
                start_time: formData.start_time.toISOString(),
                end_time: formData.end_time.toISOString(),
                player_ids: formData.players.map(player => player.player_id)
            };

            console.log('Submitting auction data:', submitData);

            if (id) {
                await axios.put(`${API_URL}/auctions/${id}`, submitData, config);
                setSuccess('Auction updated successfully');
            } else {
                await axios.post(`${API_URL}/auctions`, submitData, config);
                setSuccess('Auction created successfully');
            }

            // Navigate back after a short delay
            setTimeout(() => {
                navigate('/auctions');
            }, 1500);
        } catch (error) {
            console.error('Error saving auction:', error);
            if (error.response?.status === 403) {
                setError('You do not have permission to perform this action');
            } else {
                setError(error.response?.data?.message || 'Error saving auction');
            }
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
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    {id ? 'Edit Auction' : 'Create Auction'}
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
                                label="Auction Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <FormControl fullWidth required>
                                <InputLabel>Tournament</InputLabel>
                                <Select
                                    name="tournament_id"
                                    value={formData.tournament_id}
                                    label="Tournament"
                                    onChange={handleChange}
                                >
                                    {tournaments.map(tournament => (
                                        <MenuItem key={tournament.tournament_id} value={tournament.tournament_id}>
                                            {tournament.tournament_name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DateTimePicker
                                    label="Start Time"
                                    value={formData.start_time}
                                    onChange={handleDateChange('start_time')}
                                    renderInput={(params) => <TextField {...params} fullWidth required />}
                                    minDateTime={new Date()}
                                />
                            </LocalizationProvider>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DateTimePicker
                                    label="End Time"
                                    value={formData.end_time}
                                    onChange={handleDateChange('end_time')}
                                    renderInput={(params) => <TextField {...params} fullWidth required />}
                                    minDateTime={formData.start_time}
                                />
                            </LocalizationProvider>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Minimum Purse Amount"
                                name="min_purse"
                                type="number"
                                value={formData.min_purse}
                                onChange={handleChange}
                                required
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                    inputProps: { min: 1000000 }
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    name="status"
                                    value={formData.status}
                                    label="Status"
                                    onChange={handleChange}
                                >
                                    <MenuItem value="upcoming">Upcoming</MenuItem>
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="completed">Completed</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <Autocomplete
                                multiple
                                value={formData.players}
                                onChange={handlePlayersChange}
                                options={availablePlayers}
                                getOptionLabel={(player) => `${player.first_name} ${player.last_name} (${player.specialization})`}
                                isOptionEqualToValue={(option, value) => option.player_id === value.player_id}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Select Players"
                                        required
                                        helperText="Only players not currently in any team are shown"
                                    />
                                )}
                                renderTags={(value, getTagProps) =>
                                    value.map((player, index) => (
                                        <Chip
                                            key={player.player_id}
                                            label={`${player.first_name} ${player.last_name} (${player.specialization})`}
                                            {...getTagProps({ index })}
                                        />
                                    ))
                                }
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Box display="flex" gap={2} justifyContent="flex-end">
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate('/auctions')}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <CircularProgress size={24} />
                                    ) : id ? (
                                        'Update Auction'
                                    ) : (
                                        'Create Auction'
                                    )}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Container>
    );
};

export default AuctionEdit;
