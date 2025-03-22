import React, { useState, useEffect, useRef } from 'react';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Box,
    Button,
    TextField,
    CircularProgress,
    Alert,
    Chip,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    IconButton,
    Card,
    CardContent,
    CardMedia,
    LinearProgress,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Slide,
    Zoom,
    useTheme
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import GavelIcon from '@mui/icons-material/Gavel';
import TimerIcon from '@mui/icons-material/Timer';
import PersonIcon from '@mui/icons-material/Person';
import GroupsIcon from '@mui/icons-material/Groups';
import SportsIcon from '@mui/icons-material/Sports';
import CricketBallIcon from '@mui/icons-material/SportsCricket';
import BatIcon from '@mui/icons-material/Sports';
import MoneyIcon from '@mui/icons-material/AttachMoney';
import { styled } from '@mui/material/styles';
import useSound from 'use-sound';
import io from 'socket.io-client';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import {
    AddCircleOutline,
    RemoveCircleOutline,
    TimerOutlined,
    ShowChart
} from '@mui/icons-material';
import { green, red, orange, blue, grey } from '@mui/material/colors';

// Define base URL
const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;
const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Styled components
const BidButton = styled(Button)(({ theme }) => ({
    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
    border: 0,
    borderRadius: 3,
    boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
    color: 'white',
    height: 48,
    padding: '0 30px',
    '&:hover': {
        background: 'linear-gradient(45deg, #1976D2 30%, #00B4E5 90%)',
    }
}));

const PlayerCard = styled(Card)(({ theme }) => ({
    background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
    color: 'white',
    borderRadius: 15,
    overflow: 'hidden',
    transition: 'transform 0.3s ease-in-out',
    '&:hover': {
        transform: 'scale(1.02)',
    }
}));

const TimerChip = styled(Chip)(({ theme, time }) => ({
    background: time <= 10 ? 'linear-gradient(45deg, #f44336 30%, #ff9800 90%)' : 'linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '1.2rem',
    height: 40,
    '& .MuiChip-label': {
        padding: '0 16px',
    }
}));

const StyledCard = styled(Card)(({ theme }) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[3],
    borderRadius: theme.shape.borderRadius * 2,
    transition: 'transform 0.2s ease-in-out',
    '&:hover': {
        transform: 'translateY(-4px)',
    },
}));

const BidHistoryCard = styled(Card)(({ theme }) => ({
    maxHeight: '300px',
    overflow: 'auto',
    marginTop: theme.spacing(2),
}));

const TimerDisplay = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(2),
    backgroundColor: theme.palette.warning.main,
    color: theme.palette.warning.contrastText,
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(2),
}));

const StatCard = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
    color: 'white',
    borderRadius: theme.shape.borderRadius * 2,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2)
}));

const AnimatedBidButton = styled(BidButton)(({ theme }) => ({
    animation: 'pulse 2s infinite',
    '@keyframes pulse': {
        '0%': {
            transform: 'scale(1)',
            boxShadow: '0 0 0 0 rgba(33, 150, 243, 0.7)',
        },
        '70%': {
            transform: 'scale(1.05)',
            boxShadow: '0 0 0 10px rgba(33, 150, 243, 0)',
        },
        '100%': {
            transform: 'scale(1)',
            boxShadow: '0 0 0 0 rgba(33, 150, 243, 0)',
        },
    },
}));

const PlayerStatLabel = styled(Typography)({
    fontWeight: 500,
    color: grey[700],
    fontSize: '0.9rem',
});

const PlayerStatValue = styled(Typography)({
    fontWeight: 600,
    fontSize: '1.1rem',
});

const BidHistoryItem = styled(ListItem)({
    padding: '4px 0',
});

const TimerProgress = styled('div', {
    shouldForwardProp: (prop) => prop !== 'value' && prop !== 'color'
})(({ value, color, theme }) => ({
    height: '6px',
    width: '100%',
    backgroundColor: theme.palette.grey[300],
    borderRadius: '3px',
    position: 'relative',
    '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        width: `${value}%`,
        backgroundColor: color,
        borderRadius: '3px',
        transition: 'width 1s linear'
    }
}));

const LiveAuction = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { socket } = useSocket();
    const { user, token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [auction, setAuction] = useState(null);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [currentBid, setCurrentBid] = useState(0);
    const [customBidAmount, setCustomBidAmount] = useState('');
    const [bidHistory, setBidHistory] = useState([]);
    const [upcomingPlayers, setUpcomingPlayers] = useState([]);
    const [soldPlayers, setSoldPlayers] = useState([]);
    const [timeLeft, setTimeLeft] = useState(0);
    const [bidLeader, setBidLeader] = useState(null);
    const [teamInfo, setTeamInfo] = useState(null);
    const [canBid, setCanBid] = useState(true);
    const [registeredForAuction, setRegisteredForAuction] = useState(false);

    const socketRef = useRef();
    const threeContainerRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const playerModelRef = useRef(null);

    // Initialize 3D scene
    useEffect(() => {
        if (threeContainerRef.current && currentPlayer) {
            const initThreeJS = () => {
                // Scene setup
                const scene = new THREE.Scene();
                scene.background = new THREE.Color(0xf5f5f5);
                sceneRef.current = scene;

                // Camera setup
                const camera = new THREE.PerspectiveCamera(
                    75,
                    threeContainerRef.current.clientWidth / threeContainerRef.current.clientHeight,
                    0.1,
                    1000
                );
                camera.position.z = 5;
                cameraRef.current = camera;

                // Renderer setup
                const renderer = new THREE.WebGLRenderer({ antialias: true });
                renderer.setSize(
                    threeContainerRef.current.clientWidth,
                    threeContainerRef.current.clientHeight
                );
                threeContainerRef.current.appendChild(renderer.domElement);
                rendererRef.current = renderer;

                // Controls
                const controls = new OrbitControls(camera, renderer.domElement);
                controls.enableDamping = true;
                controls.dampingFactor = 0.25;
                controls.enableZoom = true;

                // Lighting
                const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
                scene.add(ambientLight);

                const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
                directionalLight.position.set(0, 10, 10);
                scene.add(directionalLight);

                // Create a simple avatar representation (could be replaced with player model)
                const geometry = new THREE.SphereGeometry(1, 32, 32);

                // Use player role to determine the color
                let color;
                switch (currentPlayer?.playing_role?.toLowerCase()) {
                    case 'batsman':
                        color = 0x2196f3; // Blue
                        break;
                    case 'bowler':
                        color = 0xf44336; // Red
                        break;
                    case 'all-rounder':
                        color = 0x4caf50; // Green
                        break;
                    case 'wicketkeeper':
                        color = 0xff9800; // Orange
                        break;
                    default:
                        color = 0x9c27b0; // Purple
                }

                const material = new THREE.MeshStandardMaterial({ color });
                const playerModel = new THREE.Mesh(geometry, material);
                scene.add(playerModel);
                playerModelRef.current = playerModel;

                // Add country name as text
                if (currentPlayer?.country) {
                    // Load a font first
                    const fontLoader = new FontLoader();

                    // Use a simpler approach initially without 3D text
                    const textSprite = createTextSprite(currentPlayer.country);
                    textSprite.position.set(0, -1.5, 0);
                    scene.add(textSprite);

                    // Helper function to create a text sprite
                    function createTextSprite(message) {
                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');
                        canvas.width = 256;
                        canvas.height = 128;

                        context.font = "Bold 24px Arial";
                        context.fillStyle = "rgba(0,0,0,1)";
                        context.fillText(message, 10, 64);

                        const texture = new THREE.CanvasTexture(canvas);
                        const material = new THREE.SpriteMaterial({ map: texture });
                        const sprite = new THREE.Sprite(material);
                        sprite.scale.set(2, 1, 1);

                        return sprite;
                    }
                }

                // Animation loop
                const animate = () => {
                    requestAnimationFrame(animate);

                    if (playerModelRef.current) {
                        playerModelRef.current.rotation.y += 0.01;
                    }

                    controls.update();
                    renderer.render(scene, camera);
                };

                animate();

                // Handle window resize
                const handleResize = () => {
                    if (threeContainerRef.current && cameraRef.current && rendererRef.current) {
                        cameraRef.current.aspect =
                            threeContainerRef.current.clientWidth / threeContainerRef.current.clientHeight;
                        cameraRef.current.updateProjectionMatrix();
                        rendererRef.current.setSize(
                            threeContainerRef.current.clientWidth,
                            threeContainerRef.current.clientHeight
                        );
                    }
                };

                window.addEventListener('resize', handleResize);

                return () => {
                    window.removeEventListener('resize', handleResize);
                    if (rendererRef.current && threeContainerRef.current) {
                        threeContainerRef.current.removeChild(rendererRef.current.domElement);
                    }
                };
            };

            try {
                initThreeJS();
            } catch (err) {
                console.error('Error initializing 3D scene:', err);
                // Fallback to basic display if 3D fails
            }
        }
    }, [currentPlayer]);

    // Initialize auction data and socket connection
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

                // Fetch team budget info if user is a team owner
                if (user?.role === 'team_owner') {
                    const teamRes = await axios.get(`${API_URL}/teams/my-team`, config);
                    setTeamInfo(teamRes.data);

                    // Check if registered for this auction
                    const regRes = await axios.get(`${API_URL}/auctions/${id}/registration-status`, config);
                    setRegisteredForAuction(regRes.data.isRegistered);
                }

                setLoading(false);

                // Connect to socket server
                const socket = io(SOCKET_URL, {
                    auth: {
                        token
                    }
                });

                socketRef.current = socket;

                // Join auction room
                socket.emit('joinAuction', { auctionId: id });

                // Socket event listeners
                socket.on('connect', () => {
                    console.log('Connected to socket server');
                });

                socket.on('auctionUpdate', (data) => {
                    console.log('Auction update:', data);
                    setCurrentPlayer(data.currentPlayer);
                    setCurrentBid(data.currentBid);
                    setBidLeader(data.bidLeader);
                    setTimeLeft(data.timeLeft);
                    setBidHistory(data.bidHistory);
                    setUpcomingPlayers(data.upcomingPlayers);
                    setSoldPlayers(data.soldPlayers);

                    // Reset custom bid when player changes
                    if (data.currentPlayer?.id !== currentPlayer?.id) {
                        setCustomBidAmount('');
                    }
                });

                socket.on('bidPlaced', (data) => {
                    console.log('New bid placed:', data);
                    setCurrentBid(data.amount);
                    setBidLeader(data.bidder);
                    setTimeLeft(data.timeLeft);
                    setBidHistory(prev => [data, ...prev]);
                });

                socket.on('timerUpdate', (data) => {
                    setTimeLeft(data.timeLeft);
                });

                socket.on('playerSold', (data) => {
                    console.log('Player sold:', data);
                    // Show success notification
                    if (data.buyer.id === user.id) {
                        // Success notification that you won the bid
                    }

                    setSoldPlayers(prev => [data, ...prev]);

                    // Update team info if this user won the bid
                    if (data.buyer.id === user.id && teamInfo) {
                        setTeamInfo({
                            ...teamInfo,
                            remaining_budget: teamInfo.remaining_budget - data.amount
                        });
                    }
                });

                socket.on('playerUnsold', (data) => {
                    console.log('Player unsold:', data);
                    // Show notification
                });

                socket.on('error', (error) => {
                    console.error('Socket error:', error);
                    setError(error.message || 'An error occurred during the auction');
                });

                socket.on('disconnect', () => {
                    console.log('Disconnected from socket server');
                    setError('Disconnected from auction server. Please refresh the page.');
                });

                return () => {
                    socket.off('auctionUpdate');
                    socket.off('bidPlaced');
                    socket.off('timerUpdate');
                    socket.off('playerSold');
                    socket.off('playerUnsold');
                    socket.off('error');
                    socket.disconnect();
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, token]);

    // Update canBid status
    useEffect(() => {
        if (user.role !== 'team_owner') {
            setCanBid(false);
            return;
        }

        if (!registeredForAuction) {
            setCanBid(false);
            return;
        }

        if (!teamInfo || !currentPlayer) {
            setCanBid(false);
            return;
        }

        const nextMinBid = currentBid + (auction?.bid_increment || 10000);

        // Check if team has enough budget
        if (teamInfo.remaining_budget < nextMinBid) {
            setCanBid(false);
            return;
        }

        // Check if team already has max players
        if (teamInfo.players?.length >= auction?.max_players_per_team) {
            setCanBid(false);
            return;
        }

        // Check if user is already the highest bidder
        if (bidLeader?.id === user.id) {
            setCanBid(false);
            return;
        }

        setCanBid(true);
    }, [
        user.role,
        user.id,
        registeredForAuction,
        teamInfo,
        currentPlayer,
        currentBid,
        bidLeader,
        auction
    ]);

    const handlePlaceBid = (amount) => {
        if (!socketRef.current || !canBid) return;

        const bidAmount = amount || parseInt(customBidAmount, 10);

        if (isNaN(bidAmount) || bidAmount <= currentBid) {
            setError(`Bid must be greater than the current bid (₹${currentBid.toLocaleString()})`);
            return;
        }

        if (bidAmount > teamInfo.remaining_budget) {
            setError(`Bid exceeds your remaining budget (₹${teamInfo.remaining_budget.toLocaleString()})`);
            return;
        }

        socketRef.current.emit('placeBid', {
            auctionId: id,
            playerId: currentPlayer.id,
            amount: bidAmount
        });

        // Clear custom bid amount
        setCustomBidAmount('');
    };

    const handleIncrementBid = () => {
        const incrementAmount = auction?.bid_increment || 10000;
        const nextBid = currentBid + incrementAmount;
        handlePlaceBid(nextBid);
    };

    const getPlayerRoleIcon = (role) => {
        if (!role) return <PersonIcon />;

        role = role.toLowerCase();
        if (role.includes('batsman')) return <SportsIcon />;
        if (role.includes('bowler')) return <CricketBallIcon />;
        if (role.includes('all-rounder')) return <SportsIcon />;
        return <PersonIcon />;
    };

    const getRoleColor = (role) => {
        if (!role) return blue[500];

        role = role.toLowerCase();
        if (role.includes('batsman')) return blue[700];
        if (role.includes('bowler')) return red[700];
        if (role.includes('all-rounder')) return green[700];
        if (role.includes('wicket')) return orange[700];
        return blue[500];
    };

    const getTimerColor = () => {
        const percentage = (timeLeft / (auction?.time_per_player || 60)) * 100;
        if (percentage > 60) return green[500];
        if (percentage > 30) return orange[500];
        return red[500];
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
                <Alert severity="error">
                    Auction not found or has ended
                </Alert>
                <Box mt={2}>
                    <Button
                        variant="contained"
                        onClick={() => navigate('/auctions')}
                    >
                        Back to Auctions
                    </Button>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs>
                        <Typography variant="h4" component="h1">
                            {auction.auction_name}
                        </Typography>
                        <Typography variant="subtitle1" color="textSecondary">
                            {auction.tournament_name}
                        </Typography>
                    </Grid>

                    {user.role === 'team_owner' && teamInfo && (
                        <Grid item>
                            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                                <Typography variant="body2" color="textSecondary">
                                    Your Budget
                                </Typography>
                                <Typography variant="h6" color="primary" fontWeight="bold">
                                    ₹{teamInfo.remaining_budget?.toLocaleString() || 0}
                                </Typography>
                            </Paper>
                        </Grid>
                    )}

                    <Grid item>
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/auctions')}
                        >
                            Exit Auction
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            <Grid container spacing={3}>
                {/* Current Player and Bidding */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        {currentPlayer ? (
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={5}>
                                    <Box
                                        ref={threeContainerRef}
                                        sx={{
                                            height: 300,
                                            width: '100%',
                                            backgroundColor: '#f5f5f5',
                                            borderRadius: 1,
                                            overflow: 'hidden',
                                            mb: 2
                                        }}
                                    />

                                    <Card sx={{ mb: 2 }}>
                                        <CardContent>
                                            <Typography variant="h5" gutterBottom>
                                                {currentPlayer.first_name} {currentPlayer.last_name}
                                            </Typography>

                                            <Chip
                                                icon={getPlayerRoleIcon(currentPlayer.playing_role)}
                                                label={currentPlayer.playing_role || 'Unknown Role'}
                                                sx={{
                                                    bgcolor: getRoleColor(currentPlayer.playing_role),
                                                    color: 'white',
                                                    mb: 2
                                                }}
                                            />

                                            <Grid container spacing={2}>
                                                <Grid item xs={6}>
                                                    <PlayerStatLabel>Country</PlayerStatLabel>
                                                    <PlayerStatValue>
                                                        {currentPlayer.country || 'Unknown'}
                                                    </PlayerStatValue>
                                                </Grid>

                                                <Grid item xs={6}>
                                                    <PlayerStatLabel>Age</PlayerStatLabel>
                                                    <PlayerStatValue>
                                                        {currentPlayer.age || 'N/A'}
                                                    </PlayerStatValue>
                                                </Grid>

                                                <Grid item xs={6}>
                                                    <PlayerStatLabel>Base Price</PlayerStatLabel>
                                                    <PlayerStatValue>
                                                        ₹{currentPlayer.base_price?.toLocaleString() || 'N/A'}
                                                    </PlayerStatValue>
                                                </Grid>

                                                <Grid item xs={6}>
                                                    <PlayerStatLabel>Experience</PlayerStatLabel>
                                                    <PlayerStatValue>
                                                        {currentPlayer.experience_years || 0} years
                                                    </PlayerStatValue>
                                                </Grid>
                                            </Grid>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                <Grid item xs={12} md={7}>
                                    <Box sx={{ mb: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <TimerOutlined color="action" sx={{ mr: 1 }} />
                                            <Typography variant="body2" color="textSecondary">
                                                Time Remaining
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                            <Typography variant="h4">
                                                {timeLeft} seconds
                                            </Typography>
                                        </Box>

                                        <TimerProgress
                                            value={(timeLeft / (auction.time_per_player || 60)) * 100}
                                            color={getTimerColor()}
                                        />
                                    </Box>

                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="h6" gutterBottom>
                                            Current Bid
                                        </Typography>

                                        <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 2 }}>
                                            <Typography variant="h3" component="div" color="primary" fontWeight="bold">
                                                ₹{currentBid.toLocaleString()}
                                            </Typography>
                                            {bidLeader && (
                                                <Typography variant="body1" sx={{ ml: 2, mb: 1 }}>
                                                    by {bidLeader.username || bidLeader.team_name}
                                                </Typography>
                                            )}
                                        </Box>

                                        {user.role === 'team_owner' && (
                                            <Box>
                                                <Grid container spacing={2} alignItems="center">
                                                    <Grid item xs>
                                                        <TextField
                                                            fullWidth
                                                            label="Custom Bid Amount"
                                                            placeholder={`Min: ₹${(currentBid + (auction.bid_increment || 10000)).toLocaleString()}`}
                                                            value={customBidAmount}
                                                            onChange={(e) => setCustomBidAmount(e.target.value)}
                                                            type="number"
                                                            InputProps={{
                                                                startAdornment: <Typography>₹</Typography>
                                                            }}
                                                            disabled={!canBid}
                                                        />
                                                    </Grid>

                                                    <Grid item>
                                                        <BidButton
                                                            variant="contained"
                                                            color="primary"
                                                            disabled={!canBid || !customBidAmount}
                                                            onClick={() => handlePlaceBid()}
                                                        >
                                                            Place Bid
                                                        </BidButton>
                                                    </Grid>
                                                </Grid>

                                                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                                                    <BidButton
                                                        variant="contained"
                                                        color="secondary"
                                                        startIcon={<AddCircleOutline />}
                                                        disabled={!canBid}
                                                        onClick={handleIncrementBid}
                                                        sx={{ flex: 1 }}
                                                    >
                                                        Bid ₹{(currentBid + (auction.bid_increment || 10000)).toLocaleString()}
                                                    </BidButton>
                                                </Box>

                                                {!canBid && user.role === 'team_owner' && (
                                                    <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                                                        {!registeredForAuction
                                                            ? "You are not registered for this auction"
                                                            : bidLeader?.id === user.id
                                                                ? "You are the current highest bidder"
                                                                : teamInfo?.remaining_budget < (currentBid + (auction.bid_increment || 10000))
                                                                    ? "Insufficient budget for the next bid"
                                                                    : "Cannot place bid at this time"}
                                                    </Typography>
                                                )}
                                            </Box>
                                        )}
                                    </Box>

                                    <Divider sx={{ my: 2 }} />

                                    <Typography variant="h6" gutterBottom>
                                        Bid History
                                    </Typography>

                                    <List sx={{ maxHeight: 200, overflow: 'auto' }}>
                                        {bidHistory.length > 0 ? (
                                            bidHistory.map((bid, index) => (
                                                <BidHistoryItem key={index} divider={index < bidHistory.length - 1}>
                                                    <ListItemText
                                                        primary={
                                                            <Typography variant="body2">
                                                                <strong>{bid.bidder.username || bid.bidder.team_name}</strong> bid ₹{bid.amount.toLocaleString()}
                                                            </Typography>
                                                        }
                                                        secondary={new Date(bid.timestamp).toLocaleTimeString()}
                                                    />
                                                </BidHistoryItem>
                                            ))
                                        ) : (
                                            <Typography variant="body2" color="textSecondary" sx={{ py: 2, textAlign: 'center' }}>
                                                No bids placed yet
                                            </Typography>
                                        )}
                                    </List>
                                </Grid>
                            </Grid>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 8 }}>
                                <Typography variant="h5" gutterBottom>
                                    Waiting for auction to start...
                                </Typography>
                                <CircularProgress sx={{ mt: 2 }} />
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* Sidebar - Upcoming Players and Sold Players */}
                <Grid item xs={12} md={4}>
                    <Grid container spacing={3} direction="column">
                        <Grid item>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Upcoming Players
                                </Typography>

                                {upcomingPlayers.length > 0 ? (
                                    <List disablePadding>
                                        {upcomingPlayers.slice(0, 5).map((player) => (
                                            <ListItem
                                                key={player.id}
                                                divider
                                                sx={{ px: 0 }}
                                            >
                                                <Avatar sx={{ mr: 2, bgcolor: getRoleColor(player.playing_role) }}>
                                                    {player.first_name?.[0] || 'P'}
                                                </Avatar>
                                                <ListItemText
                                                    primary={`${player.first_name} ${player.last_name}`}
                                                    secondary={
                                                        <>
                                                            {player.playing_role || 'Player'} • Base: ₹{player.base_price?.toLocaleString() || 'N/A'}
                                                        </>
                                                    }
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                ) : (
                                    <Typography variant="body2" color="textSecondary" sx={{ py: 2, textAlign: 'center' }}>
                                        No upcoming players
                                    </Typography>
                                )}
                            </Paper>
                        </Grid>

                        <Grid item>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Recently Sold
                                </Typography>

                                {soldPlayers.length > 0 ? (
                                    <List disablePadding>
                                        {soldPlayers.slice(0, 5).map((sale) => (
                                            <ListItem
                                                key={sale.player.id}
                                                divider
                                                sx={{ px: 0 }}
                                            >
                                                <Avatar sx={{ mr: 2, bgcolor: getRoleColor(sale.player.playing_role) }}>
                                                    {sale.player.first_name?.[0] || 'P'}
                                                </Avatar>
                                                <ListItemText
                                                    primary={`${sale.player.first_name} ${sale.player.last_name}`}
                                                    secondary={
                                                        <>
                                                            Sold to {sale.buyer.team_name} for ₹{sale.amount.toLocaleString()}
                                                        </>
                                                    }
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                ) : (
                                    <Typography variant="body2" color="textSecondary" sx={{ py: 2, textAlign: 'center' }}>
                                        No players sold yet
                                    </Typography>
                                )}
                            </Paper>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Container>
    );
};

export default LiveAuction;