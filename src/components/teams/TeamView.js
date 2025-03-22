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
    Card,
    CardContent,
    CardMedia,
    CardActions,
    Divider,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Pagination,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import GroupsIcon from '@mui/icons-material/Groups';

const PLAYERS_PER_PAGE = 9; // Show 9 players per page (3x3 grid)

const TeamView = () => {
    // Add API_URL constant with fallback
    const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;

    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [team, setTeam] = useState(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        team_name: '',
        home_ground: '',
        team_logo_url: '',
        established_year: new Date().getFullYear()
    });
    const [successMessage, setSuccessMessage] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [playerFilter, setPlayerFilter] = useState('all');

    const fetchTeam = async () => {
        try {
            setLoading(true);
            setError('');
            const token = localStorage.getItem('token');

            if (!token) {
                navigate('/login');
                return;
            }

            // First fetch team details
            const teamResponse = await axios.get(
                `${API_URL}/teams/my-team`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!teamResponse.data) {
                throw new Error('No team data received');
            }

            // Then fetch team players separately
            const playersResponse = await axios.get(
                `${API_URL}/teams/${teamResponse.data.id}/players`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const teamData = {
                ...teamResponse.data,
                players: Array.isArray(playersResponse.data) ? playersResponse.data : []
            };

            console.log('Team Data:', teamData); // Debug log
            setTeam(teamData);

            if (teamData.players) {
                setTotalPages(Math.ceil(teamData.players.length / PLAYERS_PER_PAGE));
            }
        } catch (err) {
            console.error('Error fetching team:', err);
            if (err.response?.status === 404) {
                navigate('/teams/create');
            } else if (err.response?.status === 401) {
                navigate('/login');
            } else {
                setError(
                    err.response?.data?.message ||
                    err.message ||
                    'Failed to fetch team details. Please try again.'
                );
                // Set empty players array to prevent undefined errors
                setTeam(prevTeam => ({
                    ...prevTeam,
                    players: []
                }));
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeam();
    }, [navigate]);

    const handlePageChange = (event, value) => {
        setPage(value);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleFilterChange = (event) => {
        setPlayerFilter(event.target.value);
        setPage(1); // Reset to first page when filter changes
    };

    const filteredPlayers = team?.players ? team.players.filter(player => {
        if (!player) return false; // Skip null/undefined players
        if (playerFilter === 'all') return true;
        return player.role?.toLowerCase() === playerFilter.toLowerCase();
    }) : [];

    const paginatedPlayers = filteredPlayers.slice(
        (page - 1) * PLAYERS_PER_PAGE,
        page * PLAYERS_PER_PAGE
    );

    const handleCreateTeam = async () => {
        try {
            setError('');
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/teams`,
                formData,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setSuccessMessage('Team created successfully!');
            setCreateDialogOpen(false);
            // Fetch updated team data
            fetchTeam();
        } catch (err) {
            console.error('Error creating team:', err);
            setError(err.response?.data?.message || 'Failed to create team');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!team) {
        return (
            <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
                <Alert severity="info">
                    You don't have a team yet. Would you like to create one?
                    <Button
                        color="primary"
                        onClick={() => navigate('/teams/create')}
                        sx={{ ml: 2 }}
                    >
                        Create Team
                    </Button>
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 2 }}
                    onClose={() => setError('')} // Allow dismissing the error
                >
                    {error}
                </Alert>
            )}

            {successMessage && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
                    {successMessage}
                </Alert>
            )}

            <Paper sx={{ p: 4, mb: 4 }}>
                <Box display="flex" alignItems="center" mb={3}>
                    {team.logo_url && (
                        <Box mr={3}>
                            <img
                                src={team.logo_url}
                                alt={team.name}
                                style={{
                                    width: 100,
                                    height: 100,
                                    objectFit: 'contain'
                                }}
                            />
                        </Box>
                    )}
                    <Box flex={1}>
                        <Typography variant="h4" component="h1" gutterBottom>
                            {team.name}
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                            {team.city}, {team.state}
                        </Typography>
                        <Typography variant="body1">
                            Home Ground: {team.home_ground}
                        </Typography>
                    </Box>
                    <Box>
                        <Chip
                            label={`Budget: ₹${team.remaining_budget?.toLocaleString()}`}
                            color="primary"
                            sx={{ mr: 1 }}
                        />
                    </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5">
                        Team Players
                    </Typography>
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Filter by Role</InputLabel>
                        <Select
                            value={playerFilter}
                            onChange={handleFilterChange}
                            label="Filter by Role"
                        >
                            <MenuItem value="all">All Players</MenuItem>
                            <MenuItem value="batsman">Batsmen</MenuItem>
                            <MenuItem value="bowler">Bowlers</MenuItem>
                            <MenuItem value="all_rounder">All Rounders</MenuItem>
                            <MenuItem value="wicket_keeper">Wicket Keepers</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                <Grid container spacing={3}>
                    {paginatedPlayers.length > 0 ? (
                        paginatedPlayers.map((player) => (
                            player && ( // Add null check for player
                                <Grid item xs={12} sm={6} md={4} key={player.id}>
                                    <Card>
                                        <CardMedia
                                            component="img"
                                            height="200"
                                            image={player.profile_image_url || '/default-player.jpg'}
                                            alt={`${player.first_name} ${player.last_name}`}
                                            loading="lazy"
                                            onError={(e) => {
                                                e.target.src = '/default-player.jpg';
                                                e.target.onerror = null;
                                            }}
                                        />
                                        <CardContent>
                                            <Typography variant="h6">
                                                {player.first_name} {player.last_name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Role: {player.role || 'N/A'}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Purchase Price: ₹{player.purchase_price?.toLocaleString() || 'N/A'}
                                            </Typography>
                                        </CardContent>
                                        <CardActions>
                                            <Button
                                                size="small"
                                                onClick={() => navigate(`/players/${player.id}`)}
                                            >
                                                View Details
                                            </Button>
                                        </CardActions>
                                    </Card>
                                </Grid>
                            )
                        ))
                    ) : (
                        <Grid item xs={12}>
                            <Alert severity="info">
                                {error ? (
                                    'Error loading players. Please try again later.'
                                ) : playerFilter === 'all' ? (
                                    'No players in your team yet. Participate in auctions to acquire players!'
                                ) : (
                                    'No players found matching the selected filter.'
                                )}
                            </Alert>
                        </Grid>
                    )}
                </Grid>

                {filteredPlayers.length > PLAYERS_PER_PAGE && (
                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                        <Pagination
                            count={Math.ceil(filteredPlayers.length / PLAYERS_PER_PAGE)}
                            page={page}
                            onChange={handlePageChange}
                            color="primary"
                            size="large"
                        />
                    </Box>
                )}

                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                    <Button
                        variant="outlined"
                        onClick={() => navigate('/players')}
                    >
                        View All Players
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate('/auctions')}
                    >
                        View Auctions
                    </Button>
                </Box>
            </Paper>

            {/* Create Team Dialog */}
            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create Your Team</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Team Name"
                            name="team_name"
                            value={formData.team_name}
                            onChange={handleInputChange}
                            required
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="Home Ground"
                            name="home_ground"
                            value={formData.home_ground}
                            onChange={handleInputChange}
                            required
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="Team Logo URL"
                            name="team_logo_url"
                            value={formData.team_logo_url}
                            onChange={handleInputChange}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="Established Year"
                            name="established_year"
                            type="number"
                            value={formData.established_year}
                            onChange={handleInputChange}
                            required
                            inputProps={{ min: 1800, max: new Date().getFullYear() }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleCreateTeam}
                        variant="contained"
                        color="primary"
                        disabled={!formData.team_name || !formData.home_ground}
                    >
                        Create Team
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default TeamView;