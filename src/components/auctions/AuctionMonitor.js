import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Box,
    Button,
    CircularProgress,
    Alert,
    Chip,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Card,
    CardContent,
    CardMedia,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import PersonIcon from '@mui/icons-material/Person';
import GroupsIcon from '@mui/icons-material/Groups';
import MoneyIcon from '@mui/icons-material/AttachMoney';
import TimerIcon from '@mui/icons-material/Timer';
import io from 'socket.io-client';

// Replace the existing API_URL and SOCKET_URL constants
const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;
const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AuctionMonitor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [auction, setAuction] = useState(null);
    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [bids, setBids] = useState([]);
    const [socket, setSocket] = useState(null);
    const [timeLeft, setTimeLeft] = useState(30);
    const [isConnected, setIsConnected] = useState(false);

    // Check if user is admin
    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        if (user?.role !== 'admin') {
            navigate('/auctions');
            return;
        }
    }, [token, user, navigate]);

    // Connect to socket and fetch auction data
    useEffect(() => {
        const fetchAuctionData = async () => {
            try {
                setLoading(true);
                const config = {
                    headers: { Authorization: `Bearer ${token}` }
                };

                // Fetch auction data
                const auctionRes = await axios.get(`${API_URL}/auctions/${id}`, config);
                setAuction(auctionRes.data);

                // Fetch players in the auction
                const playersRes = await axios.get(`${API_URL}/auctions/${id}/players`, config);
                setPlayers(playersRes.data || []);

                // Fetch registered teams
                const teamsRes = await axios.get(`${API_URL}/auctions/${id}/teams`, config);
                setTeams(teamsRes.data || []);

                setLoading(false);

                // Connect to socket server
                const socketInstance = io(SOCKET_URL, {
                    auth: { token }
                });

                socketInstance.on('connect', () => {
                    console.log('Admin connected to socket server');
                    setIsConnected(true);
                    socketInstance.emit('join-auction', { auctionId: id });
                });

                socketInstance.on('disconnect', () => {
                    console.log('Admin disconnected from socket server');
                    setIsConnected(false);
                });

                socketInstance.on('auction-player-update', (data) => {
                    setCurrentPlayer(data.currentPlayer);
                    setTimeLeft(data.timeLeft);
                });

                socketInstance.on('auction-bid-update', (data) => {
                    setBids(prevBids => [data.bid, ...prevBids].slice(0, 10));
                });

                socketInstance.on('auction-time-update', (data) => {
                    setTimeLeft(data.timeLeft);
                });

                setSocket(socketInstance);

                return () => {
                    socketInstance.disconnect();
                };
            } catch (error) {
                setError('Failed to load auction data');
                setLoading(false);
                console.error('Error loading auction data:', error);
            }
        };

        if (token) {
            fetchAuctionData();
        }

        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, token]);

    // Handle moving to next player (admin action)
    const handleNextPlayer = () => {
        if (!socket) return;

        socket.emit('admin-next-player', { auctionId: id });
    };

    // Handle ending the auction (admin action)
    const handleEndAuction = async () => {
        try {
            if (!window.confirm('Are you sure you want to end this auction?')) {
                return;
            }

            await axios.post(`${API_URL}/auctions/${id}/end`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            navigate('/auctions');
        } catch (error) {
            setError('Failed to end auction');
            console.error('Error ending auction:', error);
        }
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
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
                <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/auctions')}>
                    Back to Auctions
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ mt: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">
                    {auction?.name} - Admin Monitoring
                    {isConnected ? (
                        <Chip
                            label="Connected"
                            color="success"
                            size="small"
                            sx={{ ml: 2, verticalAlign: 'middle' }}
                        />
                    ) : (
                        <Chip
                            label="Disconnected"
                            color="error"
                            size="small"
                            sx={{ ml: 2, verticalAlign: 'middle' }}
                        />
                    )}
                </Typography>
                <Box>
                    <Button
                        variant="contained"
                        color="primary"
                        sx={{ mr: 2 }}
                        onClick={() => navigate('/auctions')}
                    >
                        Back to Auctions
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleEndAuction}
                    >
                        End Auction
                    </Button>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Current Player Section */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>
                            Current Player
                        </Typography>
                        {currentPlayer ? (
                            <>
                                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                    <Box display="flex" alignItems="center">
                                        <Avatar
                                            src={currentPlayer.image_url}
                                            alt={currentPlayer.player_name}
                                            sx={{ width: 80, height: 80, mr: 2 }}
                                        />
                                        <Box>
                                            <Typography variant="h5">
                                                {currentPlayer.player_name}
                                            </Typography>
                                            <Typography variant="body1" color="textSecondary">
                                                {currentPlayer.player_role} • {currentPlayer.country}
                                            </Typography>
                                            <Typography variant="body2">
                                                Base Price: ₹{(currentPlayer.base_price / 100000).toFixed(2)} Lakhs
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box textAlign="center">
                                        <Chip
                                            icon={<TimerIcon />}
                                            label={`${timeLeft}s`}
                                            color={timeLeft <= 10 ? "error" : "primary"}
                                            sx={{ fontSize: '1.2rem', fontWeight: 'bold', p: 2, height: 'auto' }}
                                        />
                                    </Box>
                                </Box>

                                <Box display="flex" justifyContent="space-between" alignItems="center" mt={3}>
                                    <Typography variant="body1">
                                        Current Bid: <Typography component="span" variant="h6" fontWeight="bold" color="primary">
                                            {currentPlayer.current_bid
                                                ? `₹${(currentPlayer.current_bid / 100000).toFixed(2)} Lakhs`
                                                : 'No bids yet'}
                                        </Typography>
                                    </Typography>

                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        onClick={handleNextPlayer}
                                    >
                                        Next Player
                                    </Button>
                                </Box>
                            </>
                        ) : (
                            <Typography variant="body1" color="textSecondary">
                                No player currently up for auction
                            </Typography>
                        )}
                    </Paper>
                </Grid>

                {/* Recent Bids Section */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>
                            Recent Bids
                        </Typography>
                        {bids.length > 0 ? (
                            <List>
                                {bids.map((bid, index) => (
                                    <ListItem
                                        key={index}
                                        divider={index !== bids.length - 1}
                                        sx={{
                                            bgcolor: index === 0 ? 'rgba(0, 230, 118, 0.1)' : 'transparent',
                                            animation: index === 0 ? 'highlight 1s ease' : 'none',
                                            '@keyframes highlight': {
                                                '0%': { backgroundColor: 'rgba(0, 230, 118, 0.3)' },
                                                '100%': { backgroundColor: 'rgba(0, 230, 118, 0.1)' }
                                            }
                                        }}
                                    >
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                                                <MoneyIcon />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={`₹${(bid.amount / 100000).toFixed(2)} Lakhs`}
                                            secondary={`${bid.team_name} • ${new Date(bid.timestamp).toLocaleTimeString()}`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Typography variant="body1" color="textSecondary">
                                No bids placed yet
                            </Typography>
                        )}
                    </Paper>
                </Grid>

                {/* Teams Section */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Registered Teams
                        </Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Team</TableCell>
                                        <TableCell align="right">Total Budget</TableCell>
                                        <TableCell align="right">Remaining</TableCell>
                                        <TableCell align="right">Players Bought</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {teams.map((team) => (
                                        <TableRow key={team.id}>
                                            <TableCell>
                                                <Box display="flex" alignItems="center">
                                                    {team.logo_url ? (
                                                        <Avatar src={team.logo_url} sx={{ mr: 1, width: 30, height: 30 }} />
                                                    ) : (
                                                        <Avatar sx={{ mr: 1, width: 30, height: 30 }}>
                                                            {team.team_name.charAt(0)}
                                                        </Avatar>
                                                    )}
                                                    {team.team_name}
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right">
                                                ₹{(team.total_budget / 100000).toFixed(2)} Lakhs
                                            </TableCell>
                                            <TableCell align="right">
                                                ₹{(team.remaining_budget / 100000).toFixed(2)} Lakhs
                                            </TableCell>
                                            <TableCell align="right">
                                                {team.players_bought || 0}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                {/* Players Section */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Players Status
                        </Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Player</TableCell>
                                        <TableCell>Role</TableCell>
                                        <TableCell>Base Price</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell align="right">Sold For</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {players.map((player) => (
                                        <TableRow key={player.id}>
                                            <TableCell>
                                                <Box display="flex" alignItems="center">
                                                    {player.image_url ? (
                                                        <Avatar src={player.image_url} sx={{ mr: 1, width: 30, height: 30 }} />
                                                    ) : (
                                                        <Avatar sx={{ mr: 1, width: 30, height: 30 }}>
                                                            <PersonIcon />
                                                        </Avatar>
                                                    )}
                                                    {player.player_name}
                                                </Box>
                                            </TableCell>
                                            <TableCell>{player.player_role}</TableCell>
                                            <TableCell>
                                                ₹{(player.base_price / 100000).toFixed(2)} Lakhs
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={player.status}
                                                    color={
                                                        player.status === 'sold' ? 'success' :
                                                            player.status === 'unsold' ? 'error' :
                                                                player.status === 'active' ? 'warning' :
                                                                    'default'
                                                    }
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                {player.status === 'sold' ?
                                                    `₹${(player.sold_amount / 100000).toFixed(2)} Lakhs` :
                                                    '-'
                                                }
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default AuctionMonitor;