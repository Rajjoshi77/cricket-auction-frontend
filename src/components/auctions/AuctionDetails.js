import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Button,
    Box,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;

const AuctionDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [auction, setAuction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [players, setPlayers] = useState([]);
    const [registeredTeams, setRegisteredTeams] = useState([]);
    const [openRegisterDialog, setOpenRegisterDialog] = useState(false);
    const [purseAmount, setPurseAmount] = useState('');
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        fetchAuctionDetails();
    }, [id]);

    const fetchAuctionDetails = async () => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };
            console.log('Fetching auction details...');
            const [auctionRes, playersRes, teamsRes] = await Promise.all([
                axios.get(`${API_URL}/auctions/${id}`, config),
                axios.get(`${API_URL}/auctions/${id}/players`, config),
                axios.get(`${API_URL}/auctions/${id}/teams`, config)
            ]);

            console.log('Auction details fetched:', auctionRes.data);
            console.log('Players fetched:', playersRes.data);
            console.log('Teams fetched:', teamsRes.data);

            setAuction(auctionRes.data);
            setPlayers(playersRes.data);
            setRegisteredTeams(teamsRes.data);
        } catch (error) {
            console.error('Error fetching auction details:', error);
            setError(error.response?.data?.message || 'Error fetching auction details');
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterTeam = async () => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };
            await axios.post(
                `${API_URL}/auctions/${id}/register`,
                { purse_amount: parseFloat(purseAmount) },
                config
            );

            setOpenRegisterDialog(false);
            fetchAuctionDetails(); // Refresh the data
        } catch (error) {
            setError(error.response?.data?.message || 'Error registering team');
        }
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
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
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
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

    if (!auction) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Alert severity="error">Auction not found</Alert>
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

            {/* Header Section */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h4" component="h1">
                        {auction.name}
                    </Typography>
                    <Chip
                        label={auction.status}
                        color={getStatusColor(auction.status)}
                    />
                </Box>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="body1" gutterBottom>
                            <strong>Tournament:</strong> {auction.tournament_name}
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            <strong>Start Time:</strong> {formatDate(auction.start_time)}
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            <strong>End Time:</strong> {formatDate(auction.end_time)}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="body1" gutterBottom>
                            <strong>Total Players:</strong> {players.length}
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            <strong>Registered Teams:</strong> {registeredTeams.length}
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            <strong>Minimum Purse:</strong> {formatCurrency(auction.min_purse)}
                        </Typography>
                    </Grid>
                </Grid>

                {/* Action Buttons */}
                <Box mt={3} display="flex" gap={2}>
                    {auction.status === 'active' && (
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={() => navigate(`/auctions/${id}/live`)}
                        >
                            Join Live Auction
                        </Button>
                    )}
                    {user.role === 'team_owner' && auction.status === 'upcoming' && (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => setOpenRegisterDialog(true)}
                        >
                            Register Team
                        </Button>
                    )}
                    {user.role === 'admin' && auction.status === 'upcoming' && (
                        <Button
                            variant="outlined"
                            onClick={() => navigate(`/auctions/${id}/edit`)}
                        >
                            Edit Auction
                        </Button>
                    )}
                </Box>
            </Paper>

            {/* Players Section */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Players
                </Typography>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Role</TableCell>
                                <TableCell>Base Price</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {players.map(player => (
                                <TableRow key={player._id}>
                                    <TableCell>{`${player.first_name} ${player.last_name}`}</TableCell>
                                    <TableCell>{player.role}</TableCell>
                                    <TableCell>{formatCurrency(player.base_price)}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={player.auction_status || 'Unsold'}
                                            color={player.auction_status === 'sold' ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            size="small"
                                            onClick={() => navigate(`/players/${player._id}`)}
                                        >
                                            View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Registered Teams Section */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Registered Teams
                </Typography>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Team Name</TableCell>
                                <TableCell>Owner</TableCell>
                                <TableCell>Purse Amount</TableCell>
                                <TableCell>Players Bought</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {registeredTeams.map(team => (
                                <TableRow key={team._id}>
                                    <TableCell>{team.name}</TableCell>
                                    <TableCell>{team.owner_name}</TableCell>
                                    <TableCell>{formatCurrency(team.purse_amount)}</TableCell>
                                    <TableCell>{team.players_bought}</TableCell>
                                    <TableCell>
                                        <Button
                                            size="small"
                                            onClick={() => navigate(`/teams/${team._id}`)}
                                        >
                                            View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Register Team Dialog */}
            <Dialog open={openRegisterDialog} onClose={() => setOpenRegisterDialog(false)}>
                <DialogTitle>Register Team for Auction</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        Minimum purse amount required: {formatCurrency(auction.min_purse)}
                    </Typography>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Purse Amount"
                        type="number"
                        fullWidth
                        value={purseAmount}
                        onChange={(e) => setPurseAmount(e.target.value)}
                        inputProps={{ min: auction.min_purse }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenRegisterDialog(false)}>Cancel</Button>
                    <Button
                        onClick={handleRegisterTeam}
                        color="primary"
                        disabled={!purseAmount || parseFloat(purseAmount) < auction.min_purse}
                    >
                        Register
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default AuctionDetails;