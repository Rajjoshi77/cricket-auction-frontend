import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Alert,
    CircularProgress,
    Checkbox,
    FormControlLabel,
    Autocomplete,
    Chip
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;

const CreateAuction = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [tournaments, setTournaments] = useState([]);
    const [availablePlayers, setAvailablePlayers] = useState([]);
    const [selectedPlayers, setSelectedPlayers] = useState([]);

    const [auctionData, setAuctionData] = useState({
        tournament_id: '',
        auction_name: '',
        start_time: new Date(),
        end_time: new Date(new Date().getTime() + 3600000), // Default 1 hour later
        status: 'upcoming',
        bid_increment: 10000,
        min_bid_amount: 20000,
        time_per_player: 60, // 60 seconds per player
        description: ''
    });

    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                const config = {
                    headers: { Authorization: `Bearer ${token}` }
                };
                const res = await axios.get(`${API_URL}/tournaments`, config);
                setTournaments(res.data);
            } catch (err) {
                console.error('Error fetching tournaments:', err);
                setError('Failed to fetch tournaments');
            }
        };

        fetchTournaments();
    }, [token]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setAuctionData({ ...auctionData, [name]: value });
    };

    const handleDateChange = (field, value) => {
        setAuctionData({ ...auctionData, [field]: value });
    };

    const fetchAvailablePlayers = async (tournamentId) => {
        if (!tournamentId) return;

        try {
            setLoading(true);
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            const res = await axios.get(`${API_URL}/players/available/${tournamentId}`, config);
            setAvailablePlayers(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching available players:', err);
            setError('Failed to fetch available players');
            setLoading(false);
        }
    };

    const handleTournamentChange = (e) => {
        const tournamentId = e.target.value;
        setAuctionData({ ...auctionData, tournament_id: tournamentId });
        fetchAvailablePlayers(tournamentId);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedPlayers.length === 0) {
            setError('Please select at least one player for the auction');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            // Create auction
            const auctionRes = await axios.post(`${API_URL}/auctions`, auctionData, config);
            const auctionId = auctionRes.data.auction_id;

            // Add players to the auction
            const playerPromises = selectedPlayers.map(player =>
                axios.post(`${API_URL}/auctions/${auctionId}/players`,
                    {
                        player_id: player.id,
                        base_price: player.base_price || auctionData.min_bid_amount
                    },
                    config
                )
            );

            await Promise.all(playerPromises);

            setSuccess('Auction created successfully!');
            setTimeout(() => {
                navigate('/auctions');
            }, 2000);
        } catch (err) {
            console.error('Error creating auction:', err);
            setError(err.response?.data?.message || 'Failed to create auction');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Create New Auction
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ my: 2 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ my: 2 }}>
                        {success}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4 }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Tournament</InputLabel>
                                <Select
                                    name="tournament_id"
                                    value={auctionData.tournament_id}
                                    onChange={handleTournamentChange}
                                    label="Tournament"
                                >
                                    {tournaments.map((tournament) => (
                                        <MenuItem key={tournament.id} value={tournament.id}>
                                            {tournament.tournament_name} ({tournament.season_year})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                required
                                fullWidth
                                label="Auction Name"
                                name="auction_name"
                                value={auctionData.auction_name}
                                onChange={handleChange}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DateTimePicker
                                    label="Start Time"
                                    value={auctionData.start_time}
                                    onChange={(value) => handleDateChange('start_time', value)}
                                    renderInput={(params) => <TextField {...params} fullWidth required />}
                                />
                            </LocalizationProvider>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DateTimePicker
                                    label="End Time"
                                    value={auctionData.end_time}
                                    onChange={(value) => handleDateChange('end_time', value)}
                                    renderInput={(params) => <TextField {...params} fullWidth required />}
                                />
                            </LocalizationProvider>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Minimum Bid Amount (₹)"
                                name="min_bid_amount"
                                type="number"
                                value={auctionData.min_bid_amount}
                                onChange={handleChange}
                                InputProps={{ inputProps: { min: 1000 } }}
                            />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Bid Increment (₹)"
                                name="bid_increment"
                                type="number"
                                value={auctionData.bid_increment}
                                onChange={handleChange}
                                InputProps={{ inputProps: { min: 1000 } }}
                            />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Time Per Player (seconds)"
                                name="time_per_player"
                                type="number"
                                value={auctionData.time_per_player}
                                onChange={handleChange}
                                InputProps={{ inputProps: { min: 10, max: 300 } }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description"
                                name="description"
                                value={auctionData.description}
                                onChange={handleChange}
                                multiline
                                rows={3}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                Select Players for Auction
                            </Typography>

                            {loading ? (
                                <CircularProgress />
                            ) : (
                                <Autocomplete
                                    multiple
                                    options={availablePlayers}
                                    getOptionLabel={(option) => `${option.first_name} ${option.last_name} (${option.playing_role})`}
                                    onChange={(event, newValue) => {
                                        setSelectedPlayers(newValue);
                                    }}
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => (
                                            <Chip
                                                label={`${option.first_name} ${option.last_name}`}
                                                {...getTagProps({ index })}
                                            />
                                        ))
                                    }
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            variant="outlined"
                                            label="Players"
                                            placeholder="Select players"
                                        />
                                    )}
                                />
                            )}
                            <Typography variant="caption" color="textSecondary">
                                {selectedPlayers.length} players selected
                            </Typography>
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
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
                            {loading ? <CircularProgress size={24} /> : 'Create Auction'}
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default CreateAuction;