import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Button,
    Box,
    CircularProgress,
    Alert,
    Chip,
    Card,
    CardContent,
    CardActions,
    TextField,
    MenuItem
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CalendarToday, People, GavelRounded, AccessTime } from '@mui/icons-material';

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;

const AuctionsList = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [auctions, setAuctions] = useState([]);
    const [filteredAuctions, setFilteredAuctions] = useState([]);
    const [filter, setFilter] = useState({
        status: 'all',
        search: ''
    });

    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchAuctions = async () => {
            try {
                setLoading(true);
                const config = {
                    headers: { Authorization: `Bearer ${token}` }
                };
                const response = await axios.get(`${API_URL}/auctions`, config);
                setAuctions(response.data);
                setFilteredAuctions(response.data);
            } catch (error) {
                console.error('Error fetching auctions:', error);
                setError(error.response?.data?.message || 'Error fetching auctions');
            } finally {
                setLoading(false);
            }
        };

        fetchAuctions();
    }, [token]);

    useEffect(() => {
        let result = [...auctions];

        // Apply status filter
        if (filter.status !== 'all') {
            result = result.filter(auction => auction.status === filter.status);
        }

        // Apply search filter
        if (filter.search) {
            const searchTerm = filter.search.toLowerCase();
            result = result.filter(auction =>
                auction.auction_name.toLowerCase().includes(searchTerm) ||
                auction.description?.toLowerCase().includes(searchTerm)
            );
        }

        setFilteredAuctions(result);
    }, [filter, auctions]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilter(prev => ({ ...prev, [name]: value }));
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
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleRegisterForAuction = async (auctionId) => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };
            await axios.post(`${API_URL}/auctions/${auctionId}/register`, {}, config);

            // Update auction list
            const newAuctions = auctions.map(auction => {
                if (auction.id === auctionId) {
                    return { ...auction, isRegistered: true };
                }
                return auction;
            });

            setAuctions(newAuctions);
            setFilteredAuctions(newAuctions.filter(auction =>
                (filter.status === 'all' || auction.status === filter.status) &&
                (!filter.search || auction.auction_name.toLowerCase().includes(filter.search.toLowerCase()))
            ));

        } catch (error) {
            console.error('Error registering for auction:', error);
            setError(error.response?.data?.message || 'Failed to register for auction');
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
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Box sx={{ mb: 4 }}>
                <Grid container spacing={2} alignItems="center" justifyContent="space-between">
                    <Grid item xs={12} md={8}>
                        <Typography variant="h4" component="h1" gutterBottom>
                            Auctions
                        </Typography>
                    </Grid>
                    {user.role === 'admin' && (
                        <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => navigate('/auctions/create')}
                            >
                                Create Auction
                            </Button>
                        </Grid>
                    )}
                </Grid>
            </Box>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                        <TextField
                            fullWidth
                            label="Search Auctions"
                            name="search"
                            value={filter.search}
                            onChange={handleFilterChange}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
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

            {filteredAuctions.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h6">No auctions found</Typography>
                    <Typography variant="body1" color="textSecondary">
                        {filter.status !== 'all' || filter.search
                            ? 'Try changing your search filters'
                            : 'There are no auctions available at this time'}
                    </Typography>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {filteredAuctions.map((auction) => (
                        <Grid item xs={12} md={6} lg={4} key={auction.id}>
                            <Card
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'transform 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: 4
                                    }
                                }}
                            >
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Typography variant="h5" component="h2">
                                            {auction.auction_name}
                                        </Typography>
                                        <Chip
                                            label={auction.status}
                                            color={getStatusColor(auction.status)}
                                            size="small"
                                        />
                                    </Box>

                                    <Typography variant="body2" color="text.secondary" paragraph>
                                        {auction.description || 'No description available'}
                                    </Typography>

                                    <Box sx={{ mt: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <CalendarToday fontSize="small" sx={{ mr: 1 }} />
                                            <Typography variant="body2">
                                                {formatDate(auction.start_time)}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <People fontSize="small" sx={{ mr: 1 }} />
                                            <Typography variant="body2">
                                                {auction.registered_teams || 0} teams registered
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <GavelRounded fontSize="small" sx={{ mr: 1 }} />
                                            <Typography variant="body2">
                                                Min Bid: ₹{auction.min_bid_amount?.toLocaleString() || 'N/A'}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <AccessTime fontSize="small" sx={{ mr: 1 }} />
                                            <Typography variant="body2">
                                                {auction.time_per_player || 60} seconds per player
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>

                                <CardActions sx={{ p: 2, pt: 0 }}>
                                    <Button
                                        size="small"
                                        onClick={() => navigate(`/auctions/${auction.id}`)}
                                    >
                                        View Details
                                    </Button>

                                    {user.role === 'team_owner' && auction.status === 'upcoming' && !auction.isRegistered && (
                                        <Button
                                            size="small"
                                            color="primary"
                                            variant="contained"
                                            onClick={() => handleRegisterForAuction(auction.id)}
                                        >
                                            Register
                                        </Button>
                                    )}

                                    {auction.status === 'active' && (
                                        <Button
                                            size="small"
                                            color="secondary"
                                            variant="contained"
                                            onClick={() => navigate(`/auctions/${auction.id}/live`)}
                                        >
                                            Join Auction
                                        </Button>
                                    )}
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Container>
    );
};

export default AuctionsList;