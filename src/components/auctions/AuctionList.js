import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Button,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert,
    Chip,
    IconButton,
    Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import { useAuction } from '../../contexts/AuctionContext';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;

const AuctionList = () => {
    const navigate = useNavigate();
    const { auctions, loading, error, fetchAuctions } = useAuction();
    const { user, token } = useAuth();
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        fetchAuctions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, navigate]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this auction?')) {
            return;
        }

        setDeleteLoading(true);
        setDeleteError('');

        try {
            await axios.delete(`${API_URL}/auctions/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            fetchAuctions(); // Refresh the list
        } catch (error) {
            console.error('Error deleting auction:', error);
            setDeleteError(error.response?.data?.message || 'Error deleting auction');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleStartAuction = async (auctionId) => {
        try {
            const response = await fetch(`${API_URL}/auctions/${auctionId}/start`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error('Failed to start auction');
            }
            fetchAuctions();
        } catch (error) {
            console.error('Error starting auction:', error);
            setDeleteError('Error starting auction');
        }
    };

    const handleRegisterTeam = async (auctionId) => {
        try {
            const response = await fetch(`${API_URL}/auctions/${auctionId}/register`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error('Failed to register team');
            }
            fetchAuctions();
        } catch (error) {
            console.error('Error registering team:', error);
            setDeleteError('Error registering team');
        }
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
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

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {(error || deleteError) && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error || deleteError}
                </Alert>
            )}

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1">
                    Auctions
                </Typography>
                {user?.role === 'admin' && (
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/auctions/create')}
                    >
                        Create Auction
                    </Button>
                )}
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Tournament</TableCell>
                            <TableCell>Start Time</TableCell>
                            <TableCell>End Time</TableCell>
                            <TableCell align="right">Min Purse</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="center">Teams</TableCell>
                            <TableCell align="center">Players</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {auctions?.map((auction) => (
                            <TableRow key={auction.id}>
                                <TableCell>{auction.name}</TableCell>
                                <TableCell>{auction.tournament_name}</TableCell>
                                <TableCell>{formatDateTime(auction.start_time)}</TableCell>
                                <TableCell>{formatDateTime(auction.end_time)}</TableCell>
                                <TableCell align="right">{formatCurrency(auction.min_purse)}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={auction.status}
                                        color={getStatusColor(auction.status)}
                                        size="small"
                                        sx={{ textTransform: 'capitalize' }}
                                    />
                                </TableCell>
                                <TableCell align="center">{auction.registered_teams || 0}</TableCell>
                                <TableCell align="center">{auction.total_players || 0}</TableCell>
                                <TableCell align="right">
                                    <Box display="flex" justifyContent="flex-end">
                                        <Tooltip title="View">
                                            <IconButton
                                                onClick={() => navigate(`/auctions/${auction.id}`)}
                                                size="small"
                                            >
                                                <VisibilityIcon />
                                            </IconButton>
                                        </Tooltip>
                                        {auction.status === 'upcoming' && user?.role === 'admin' && (
                                            <>
                                                <Tooltip title="Edit">
                                                    <IconButton
                                                        onClick={() => navigate(`/auctions/${auction.id}/edit`)}
                                                        size="small"
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                    <IconButton
                                                        onClick={() => handleDelete(auction.id)}
                                                        size="small"
                                                        color="error"
                                                        disabled={deleteLoading}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Start Auction">
                                                    <Button
                                                        variant="contained"
                                                        color="success"
                                                        size="small"
                                                        onClick={() => {
                                                            if (window.confirm('Are you sure you want to start this auction?')) {
                                                                handleStartAuction(auction.id);
                                                            }
                                                        }}
                                                        sx={{ ml: 1 }}
                                                    >
                                                        Start
                                                    </Button>
                                                </Tooltip>
                                            </>
                                        )}
                                        {auction.status === 'active' && user?.role === 'team_owner' && (
                                            <Tooltip title="Join Live Auction">
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    size="small"
                                                    onClick={() => navigate(`/auctions/${auction.id}/live`)}
                                                    sx={{ ml: 1 }}
                                                >
                                                    Join
                                                </Button>
                                            </Tooltip>
                                        )}
                                        {auction.status === 'active' && user?.role === 'admin' && (
                                            <Tooltip title="Monitor Live Auction">
                                                <Button
                                                    variant="contained"
                                                    color="info"
                                                    size="small"
                                                    onClick={() => navigate(`/auctions/${auction.id}/monitor`)}
                                                    sx={{ ml: 1 }}
                                                >
                                                    Monitor
                                                </Button>
                                            </Tooltip>
                                        )}
                                        {auction.status === 'upcoming' && user?.role === 'team_owner' && !auction.isRegistered && (
                                            <Tooltip title="Register Team">
                                                <Button
                                                    variant="outlined"
                                                    color="primary"
                                                    size="small"
                                                    onClick={() => {
                                                        if (window.confirm('Register your team for this auction?')) {
                                                            handleRegisterTeam(auction.id);
                                                        }
                                                    }}
                                                    sx={{ ml: 1 }}
                                                >
                                                    Register
                                                </Button>
                                            </Tooltip>
                                        )}
                                        {auction.status === 'upcoming' && user?.role === 'team_owner' && auction.isRegistered && (
                                            <Chip
                                                label="Registered"
                                                color="success"
                                                size="small"
                                                sx={{ ml: 1 }}
                                            />
                                        )}
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                        {(!auctions || auctions.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={9} align="center">
                                    No auctions found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
};

export default AuctionList;