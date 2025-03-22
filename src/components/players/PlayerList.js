import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    Card,
    CardContent,
    CardMedia,
    CardActions,
    Alert,
    CircularProgress,
    Pagination,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Stack
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;

const PlayerList = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({
        role: '',
        country: '',
        status: '',
        specialization: ''
    });
    const playersPerPage = 12;

    useEffect(() => {
        const fetchPlayers = async () => {
            try {
                setLoading(true);
                setError('');
                const token = localStorage.getItem('token');

                if (!token) {
                    navigate('/login');
                    return;
                }

                const response = await axios.get(
                    `${API_URL}/players`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (Array.isArray(response.data)) {
                    setPlayers(response.data);
                } else {
                    console.error('Unexpected API response format:', response.data);
                    setError('Unexpected data format received from server');
                }
                setLoading(false);
            } catch (err) {
                console.error('Error fetching players:', err);
                setError(err.response?.data?.message || 'Failed to fetch players');
                setPlayers([]);
                setLoading(false);

                if (err.response?.status === 401) {
                    navigate('/login');
                }
            }
        };

        fetchPlayers();
    }, [navigate]);

    const handleFilterChange = (event) => {
        const { name, value } = event.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
        setPage(1); // Reset to first page when filters change
    };

    const filteredPlayers = players.filter(player => {
        const matchesSearch = (
            player?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            player?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            player?.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            player?.country?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const matchesRole = !filters.role || player?.role === filters.role;
        const matchesCountry = !filters.country || player?.country === filters.country;
        const matchesStatus = !filters.status || player?.status === filters.status;
        const matchesSpecialization = !filters.specialization || player?.specialization === filters.specialization;

        return matchesSearch && matchesRole && matchesCountry && matchesStatus && matchesSpecialization;
    });

    // Get unique values for filters
    const uniqueCountries = [...new Set(players.map(player => player.country))].filter(Boolean);
    const uniqueRoles = [...new Set(players.map(player => player.role))].filter(Boolean);
    const uniqueSpecializations = [...new Set(players.map(player => player.specialization))].filter(Boolean);

    // Calculate pagination
    const totalPages = Math.ceil(filteredPlayers.length / playersPerPage);
    const startIndex = (page - 1) * playersPerPage;
    const paginatedPlayers = filteredPlayers.slice(startIndex, startIndex + playersPerPage);

    const handlePageChange = (event, value) => {
        setPage(value);
        window.scrollTo(0, 0);
    };

    useEffect(() => {
        setPage(1);
    }, [searchTerm, filters]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'available':
                return 'success';
            case 'sold':
                return 'error';
            case 'pending':
                return 'warning';
            default:
                return 'default';
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Players Directory
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Search Players"
                            variant="outlined"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by name, role, or country"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Role</InputLabel>
                            <Select
                                name="role"
                                value={filters.role}
                                onChange={handleFilterChange}
                                label="Role"
                            >
                                <MenuItem value="">All Roles</MenuItem>
                                {uniqueRoles.map(role => (
                                    <MenuItem key={role} value={role}>
                                        {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Country</InputLabel>
                            <Select
                                name="country"
                                value={filters.country}
                                onChange={handleFilterChange}
                                label="Country"
                            >
                                <MenuItem value="">All Countries</MenuItem>
                                {uniqueCountries.map(country => (
                                    <MenuItem key={country} value={country}>{country}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                name="status"
                                value={filters.status}
                                onChange={handleFilterChange}
                                label="Status"
                            >
                                <MenuItem value="">All Status</MenuItem>
                                <MenuItem value="available">Available</MenuItem>
                                <MenuItem value="sold">Sold</MenuItem>
                                <MenuItem value="pending">Pending</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Specialization</InputLabel>
                            <Select
                                name="specialization"
                                value={filters.specialization}
                                onChange={handleFilterChange}
                                label="Specialization"
                            >
                                <MenuItem value="">All Specializations</MenuItem>
                                {uniqueSpecializations.map(spec => (
                                    <MenuItem key={spec} value={spec}>
                                        {spec.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Paper>

            <Grid container spacing={3}>
                {paginatedPlayers.map((player) => (
                    <Grid item xs={12} sm={6} md={4} key={player.id}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <CardMedia
                                component="img"
                                height="200"
                                image={player.profile_image_url || '/default-player.jpg'}
                                alt={`${player.first_name} ${player.last_name}`}
                                sx={{ objectFit: 'cover' }}
                            />
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                    <Typography variant="h6" component="h2">
                                        {player.first_name} {player.last_name}
                                    </Typography>
                                    <Chip
                                        label={player.status}
                                        color={getStatusColor(player.status)}
                                        size="small"
                                    />
                                </Box>
                                <Stack spacing={1}>
                                    <Typography variant="body2" color="text.secondary">
                                        Role: {player.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Specialization: {player.specialization?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Country: {player.country}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Age: {player.age} years
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Base Price: ₹{player.base_price?.toLocaleString() || 'N/A'}
                                    </Typography>
                                </Stack>
                            </CardContent>
                            <CardActions>
                                <Button
                                    size="small"
                                    onClick={() => navigate(`/players/${player.id}`)}
                                    sx={{ ml: 'auto' }}
                                >
                                    View Details
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {filteredPlayers.length === 0 && !loading && (
                <Box textAlign="center" py={4}>
                    <Typography variant="h6" color="text.secondary">
                        No players found matching your search criteria
                    </Typography>
                </Box>
            )}

            {filteredPlayers.length > 0 && (
                <Box display="flex" justifyContent="center" mt={4} mb={2}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                        size="large"
                    />
                </Box>
            )}
        </Container>
    );
};

export default PlayerList;