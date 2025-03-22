import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Button,
    TextField,
    Alert,
    CircularProgress,
    Chip
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;

const AuctionLive = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { socket, isConnected } = useSocket();

    const [auction, setAuction] = useState(null);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [currentBid, setCurrentBid] = useState(0);
    const [highestBidder, setHighestBidder] = useState(null);
    const [bidAmount, setBidAmount] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [bidError, setBidError] = useState('');
    const [teamDetails, setTeamDetails] = useState(null);

    // Fetch team details if user is a team owner
    useEffect(() => {
        const fetchTeamDetails = async () => {
            if (user?.role !== 'team_owner') return;

            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(
                    `${API_URL}/teams/my-team`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                console.log('Team details fetched:', response.data);
                setTeamDetails(response.data);
            } catch (err) {
                console.error('Error fetching team details:', err);
                setError('Failed to fetch team details. You may not be able to participate in the auction.');
            }
        };

        fetchTeamDetails();
    }, [user]);

    useEffect(() => {
        const fetchAuctionDetails = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(
                    `${API_URL}/auctions/${id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                console.log('Auction details fetched:', response.data);
                setAuction(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching auction details:', err);
                setError(err.response?.data?.message || 'Failed to fetch auction details');
                setLoading(false);
            }
        };

        fetchAuctionDetails();
    }, [id]);

    useEffect(() => {
        if (!socket || !isConnected) {
            console.log('Socket not connected, skipping socket setup');
            return;
        }

        if (!teamDetails && user?.role === 'team_owner') {
            console.log('Team details not available for team owner');
            return;
        }

        console.log('Setting up socket connection for auction:', id);
        socket.emit('join_auction', {
            auction_id: id,
            team_id: teamDetails?.id,
            user_role: user?.role
        });

        socket.on('player_update', (data) => {
            console.log('Received player update:', data);
            setCurrentPlayer(data.player);
            setCurrentBid(data.current_bid);
            setHighestBidder(data.highest_bidder);
        });

        socket.on('bid_update', (data) => {
            console.log('Received bid update:', data);
            setCurrentBid(data.amount);
            setHighestBidder(data.bidder);
        });

        socket.on('auction_error', (data) => {
            console.error('Received auction error:', data);
            setBidError(data.message);
        });

        socket.on('join_error', (data) => {
            console.error('Join auction error:', data);
            setError(data.message);
        });

        return () => {
            console.log('Cleaning up socket listeners');
            if (socket && isConnected) {
                socket.emit('leave_auction', {
                    auction_id: id,
                    team_id: teamDetails?.id
                });
                socket.off('player_update');
                socket.off('bid_update');
                socket.off('auction_error');
                socket.off('join_error');
            }
        };
    }, [socket, isConnected, id, teamDetails, user]);

    const handleBid = () => {
        if (!socket || !isConnected || !currentPlayer) {
            setBidError('Not connected to auction server');
            return;
        }

        if (!teamDetails) {
            setBidError('Team details not available. Cannot place bid.');
            return;
        }

        const amount = parseInt(bidAmount);
        if (isNaN(amount) || amount <= currentBid) {
            setBidError('Bid amount must be higher than current bid');
            return;
        }

        if (amount > teamDetails.remaining_budget) {
            setBidError(`Bid amount exceeds your team's remaining budget of ₹${teamDetails.remaining_budget.toLocaleString()}`);
            return;
        }

        console.log('Placing bid:', {
            auction_id: id,
            player_id: currentPlayer.id,
            amount,
            team_id: teamDetails.id
        });

        socket.emit('place_bid', {
            auction_id: id,
            player_id: currentPlayer.id,
            amount: amount,
            team_id: teamDetails.id
        });

        setBidAmount('');
        setBidError('');
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Live Auction
                </Typography>

                {!isConnected && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Not connected to auction server. Trying to reconnect...
                    </Alert>
                )}

                {user?.role === 'team_owner' && teamDetails && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Team Budget: ₹{teamDetails.remaining_budget?.toLocaleString() || 0}
                    </Alert>
                )}

                {currentPlayer ? (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardMedia
                                    component="img"
                                    height="200"
                                    image={currentPlayer.image_url || '/default-player.jpg'}
                                    alt={`${currentPlayer.first_name} ${currentPlayer.last_name}`}
                                />
                                <CardContent>
                                    <Typography variant="h5">
                                        {currentPlayer.first_name} {currentPlayer.last_name}
                                    </Typography>
                                    <Typography color="textSecondary">
                                        {currentPlayer.role} - {currentPlayer.country}
                                    </Typography>
                                    <Typography variant="h6" sx={{ mt: 2 }}>
                                        Current Bid: ₹{currentBid.toLocaleString()}
                                    </Typography>
                                    {highestBidder && (
                                        <Typography color="textSecondary">
                                            Highest Bidder: {highestBidder.team_name}
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                        {user?.role === 'team_owner' && teamDetails && (
                            <Grid item xs={12} md={8}>
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Place Your Bid
                                    </Typography>
                                    {bidError && (
                                        <Alert severity="error" sx={{ mb: 2 }}>
                                            {bidError}
                                        </Alert>
                                    )}
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <TextField
                                            type="number"
                                            label="Bid Amount"
                                            value={bidAmount}
                                            onChange={(e) => setBidAmount(e.target.value)}
                                            fullWidth
                                        />
                                        <Button
                                            variant="contained"
                                            onClick={handleBid}
                                            disabled={!isConnected}
                                        >
                                            Place Bid
                                        </Button>
                                    </Box>
                                </Paper>
                            </Grid>
                        )}
                    </Grid>
                ) : (
                    <Alert severity="info">
                        Waiting for auction to start...
                    </Alert>
                )}
            </Paper>
        </Container>
    );
};

export default AuctionLive;