import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    CircularProgress,
    Alert,
    Chip,
    Divider,
    Card,
    CardContent,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    TextField,
} from '@mui/material';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import GavelIcon from '@mui/icons-material/Gavel';
import { useAuth } from '../../contexts/AuthContext';
import { styled } from '@mui/material/styles';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;

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

const StatusChip = styled(Chip)(({ theme, status }) => ({
    backgroundColor: status === 'active' ? theme.palette.success.main :
        status === 'upcoming' ? theme.palette.warning.main :
            theme.palette.error.main,
    color: theme.palette.common.white,
}));

const AuctionView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [auction, setAuction] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null });
    const [openRegisterDialog, setOpenRegisterDialog] = useState(false);
    const [purseAmount, setPurseAmount] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [deleteDialog, setDeleteDialog] = useState(false);

    useEffect(() => {
        fetchAuctionData();
    }, [id]);

    const fetchAuctionData = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/auctions/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAuction(response.data);
            setLoading(false);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to fetch auction data');
            setLoading(false);
        }
    };

    const handleStartAuction = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `${API_URL}/auctions/${id}/status`,
                { status: 'active' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            navigate(`/auctions/${id}/live`);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to start auction');
        }
    };

    const handleEndAuction = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `${API_URL}/auctions/${id}/status`,
                { status: 'completed' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchAuctionData();
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to end auction');
        }
    };

    const handleConfirmDialog = (action) => {
        setConfirmDialog({
            open: true,
            action,
            title: action === 'start' ? 'Start Auction' : 'End Auction',
            message: action === 'start'
                ? 'Are you sure you want to start this auction? This will begin the bidding process.'
                : 'Are you sure you want to end this auction? This action cannot be undone.',
        });
    };

    const handleConfirm = async () => {
        if (confirmDialog.action === 'start') {
            await handleStartAuction();
        } else {
            await handleEndAuction();
        }
        setConfirmDialog({ open: false, action: null });
    };

    const handleRegisterTeam = async () => {
        try {
            setError('');
            const token = localStorage.getItem('token');

            // First check if user has a team
            const teamResponse = await axios.get(
                `${API_URL}/teams/my-team`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (!teamResponse.data || !teamResponse.data.team_id) {
                setError('You need to create a team first. Please go to Teams section to create your team.');
                return;
            }

            // Register for auction
            await axios.post(
                `${API_URL}/auctions/${id}/register`,
                {
                    team_id: teamResponse.data.team_id,
                    purse_amount: parseFloat(purseAmount)
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setOpenRegisterDialog(false);
            setSuccessMessage('Team registered successfully for the auction!');
            // Refresh auction data
            fetchAuctionData();
        } catch (err) {
            console.error('Error registering for auction:', err);
            setError(err.response?.data?.message || 'Failed to register for auction');
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

    const renderActionButtons = () => {
        if (!user) return null;

        return (
            <Box mt={3} display="flex" gap={2}>
                {auction.status === 'active' && (
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate(`/auctions/${id}/live`)}
                        startIcon={<PlayArrowIcon />}
                    >
                        Join Live Auction
                    </Button>
                )}

                {user.role === 'team_owner' && auction.status === 'upcoming' && (
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => setOpenRegisterDialog(true)}
                        startIcon={<HowToRegIcon />}
                    >
                        Register Team
                    </Button>
                )}

                {user.role === 'admin' && (
                    <>
                        <Button
                            variant="outlined"
                            onClick={() => navigate(`/auctions/${id}/edit`)}
                            startIcon={<EditIcon />}
                        >
                            Edit Auction
                        </Button>
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={handleDeleteClick}
                            startIcon={<DeleteIcon />}
                        >
                            Delete Auction
                        </Button>
                    </>
                )}
            </Box>
        );
    };

    const renderRegisterDialog = () => (
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
                    error={parseFloat(purseAmount) < auction.min_purse}
                    helperText={parseFloat(purseAmount) < auction.min_purse ? 'Amount must be at least the minimum purse' : ''}
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
    );

    const handleDeleteClick = () => {
        setDeleteDialog(true);
    };

    const handleDelete = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(
                `${API_URL}/auctions/${id}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            navigate('/auctions');
        } catch (err) {
            console.error('Error deleting auction:', err);
            setError(err.response?.data?.message || 'Failed to delete auction');
        } finally {
            setDeleteDialog(false);
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
            <Box m={3}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {loading ? (
                <Box display="flex" justifyContent="center">
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            ) : (
                <>
                    {successMessage && (
                        <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>
                    )}

                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h4" gutterBottom>
                            {auction.name}
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={8}>
                                <StyledCard>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            Tournament
                                        </Typography>
                                        <Typography color="text.secondary" mb={2}>
                                            {auction.tournament_name}
                                        </Typography>

                                        <Typography variant="h6" gutterBottom>
                                            Schedule
                                        </Typography>
                                        <Typography color="text.secondary" mb={2}>
                                            Start: {formatDateTime(auction.start_time)}
                                            <br />
                                            End: {formatDateTime(auction.end_time)}
                                        </Typography>

                                        <Typography variant="h6" gutterBottom>
                                            Minimum Purse
                                        </Typography>
                                        <Typography color="text.secondary">
                                            {formatCurrency(auction.min_purse)}
                                        </Typography>
                                    </CardContent>
                                </StyledCard>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <StyledCard>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            Actions
                                        </Typography>

                                        {renderActionButtons()}
                                    </CardContent>
                                </StyledCard>
                            </Grid>
                        </Grid>
                    </Paper>

                    <Paper sx={{ p: 3, mt: 3 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Registered Teams
                        </Typography>
                        <TableContainer component={Paper} sx={{ mb: 3 }}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Team Name</TableCell>
                                        <TableCell align="right">Initial Purse</TableCell>
                                        <TableCell align="right">Remaining Amount</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {auction.teams?.map((team) => (
                                        <TableRow key={team.id}>
                                            <TableCell>{team.name}</TableCell>
                                            <TableCell align="right">{formatCurrency(team.purse_amount)}</TableCell>
                                            <TableCell align="right">{formatCurrency(team.remaining_amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                    {(!auction.teams || auction.teams.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={3} align="center">No teams registered yet</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Players
                        </Typography>
                        <TableContainer component={Paper} sx={{ mb: 3 }}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Player Name</TableCell>
                                        <TableCell>Role</TableCell>
                                        <TableCell>Specialization</TableCell>
                                        <TableCell align="right">Base Price</TableCell>
                                        <TableCell align="right">Sold Price</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Winning Team</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {auction.players?.map((player) => (
                                        <TableRow key={player.id}>
                                            <TableCell>{`${player.first_name} ${player.last_name}`}</TableCell>
                                            <TableCell>{player.role}</TableCell>
                                            <TableCell>{player.specialization}</TableCell>
                                            <TableCell align="right">{formatCurrency(player.base_price)}</TableCell>
                                            <TableCell align="right">
                                                {player.sold_price ? formatCurrency(player.sold_price) : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={player.auction_status || 'pending'}
                                                    color={player.auction_status === 'sold' ? 'success' : 'default'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>{player.winning_team_name || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                    {(!auction.players || auction.players.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center">No players added yet</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {auction.status === 'active' && (
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Recent Bids
                            </Typography>
                        )}
                        {auction.status === 'active' && (
                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Time</TableCell>
                                            <TableCell>Team</TableCell>
                                            <TableCell>Player</TableCell>
                                            <TableCell align="right">Bid Amount</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {auction.bids?.map((bid) => (
                                            <TableRow key={bid.id}>
                                                <TableCell>{formatDateTime(bid.timestamp)}</TableCell>
                                                <TableCell>{bid.team_name}</TableCell>
                                                <TableCell>{bid.player_name}</TableCell>
                                                <TableCell align="right">{formatCurrency(bid.amount)}</TableCell>
                                            </TableRow>
                                        ))}
                                        {(!auction.bids || auction.bids.length === 0) && (
                                            <TableRow>
                                                <TableCell colSpan={4} align="center">No bids placed yet</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}

                        <Box display="flex" gap={2} justifyContent="flex-end" mt={3}>
                            <Button
                                variant="outlined"
                                onClick={() => navigate('/auctions')}
                            >
                                Back to Auctions
                            </Button>
                        </Box>
                    </Paper>

                    {renderRegisterDialog()}
                </>
            )}

            <Dialog
                open={confirmDialog.open}
                onClose={() => setConfirmDialog({ open: false, action: null })}
            >
                <DialogTitle>{confirmDialog.title}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {confirmDialog.message}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialog({ open: false, action: null })}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} color="primary" variant="contained">
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={deleteDialog}
                onClose={() => setDeleteDialog(false)}
            >
                <DialogTitle>Delete Auction</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this auction? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default AuctionView;