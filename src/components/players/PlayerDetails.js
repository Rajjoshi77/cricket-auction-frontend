import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Box,
    Tabs,
    Tab,
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
    Avatar,
    List,
    ListItem,
    ListItemText,
    Divider,
    Card,
    CardContent
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import {
    SportsCricket as CricketIcon,
    EmojiEvents as TrophyIcon,
    Timeline as TimelineIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;

// Tab Panel Component
function TabPanel({ children, value, index }) {
    return (
        <div hidden={value !== index} style={{ paddingTop: '20px' }}>
            {value === index && children}
        </div>
    );
}

const PlayerDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [player, setPlayer] = useState(null);
    const [tabValue, setTabValue] = useState(0);

    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchPlayerDetails = async () => {
            try {
                console.log(`Fetching details for player ID: ${id}`);
                const config = {
                    headers: { Authorization: `Bearer ${token}` }
                };

                // Update the API URL to use environment variable
                const playerRes = await axios.get(`${API_URL}/players/${id}`, config);
                console.log('Player data received:', playerRes.data);

                // Create a simplified player object with default values for missing data
                setPlayer({
                    ...playerRes.data,
                    statistics: {
                        total_matches: 0,
                        years_of_experience: 0,
                        batting: {
                            total_runs: 0,
                            average: 0,
                            strike_rate: 0,
                            highest_score: 0,
                            centuries: 0,
                            fifties: 0
                        },
                        bowling: {
                            wickets: 0,
                            economy: 0,
                            average: 0,
                            best_figures: '0/0',
                            five_wickets: 0
                        },
                        achievements: []
                    },
                    history: []
                });
            } catch (error) {
                console.error('Error fetching player details:', error);
                setError(error.response?.data?.message || 'Error fetching player details. Please check the console for details.');
            } finally {
                setLoading(false);
            }
        };

        fetchPlayerDetails();
    }, [id, token]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'available':
                return 'success';
            case 'unavailable':
                return 'error';
            case 'injured':
                return 'warning';
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

    if (!player) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Alert severity="error">Player not found</Alert>
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

            {/* Player Header */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={2}>
                        <Avatar
                            src={player.profile_image_url}
                            alt={`${player.first_name} ${player.last_name}`}
                            sx={{ width: 120, height: 120 }}
                        >
                            {player.first_name[0]}
                        </Avatar>
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Typography variant="h4" component="h1">
                                {player.first_name} {player.last_name}
                            </Typography>
                            <Chip
                                label={player.status}
                                color={getStatusColor(player.status)}
                            />
                        </Box>
                        <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                            {player.role} • {player.specialization}
                        </Typography>
                        <Typography variant="body1">
                            {player.country} • Age: {player.age}
                        </Typography>
                    </Grid>
                    {user.role === 'admin' && (
                        <Grid item xs={12} md={2} sx={{ textAlign: 'right' }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => navigate(`/players/${id}/edit`)}
                            >
                                Edit Player
                            </Button>
                        </Grid>
                    )}
                </Grid>
            </Paper>

            {/* Quick Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Base Price
                            </Typography>
                            <Typography variant="h5">
                                {formatCurrency(player.base_price)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Matches Played
                            </Typography>
                            <Typography variant="h5">
                                {player.statistics.total_matches}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Current Team
                            </Typography>
                            <Typography variant="h5">
                                {player.team_name || 'Free Agent'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Experience
                            </Typography>
                            <Typography variant="h5">
                                {player.statistics.years_of_experience} Years
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Tabs Navigation */}
            <Paper sx={{ mb: 3 }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab icon={<CricketIcon />} label="Statistics" />
                    <Tab icon={<TrophyIcon />} label="Achievements" />
                    <Tab icon={<TimelineIcon />} label="Career History" />
                </Tabs>

                {/* Statistics Tab */}
                <TabPanel value={tabValue} index={0}>
                    <Grid container spacing={3}>
                        {/* Batting Stats */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>
                                Batting Statistics
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableBody>
                                        <TableRow>
                                            <TableCell>Total Runs</TableCell>
                                            <TableCell align="right">{player.statistics.batting.total_runs}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Average</TableCell>
                                            <TableCell align="right">{player.statistics.batting.average.toFixed(2)}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Strike Rate</TableCell>
                                            <TableCell align="right">{player.statistics.batting.strike_rate.toFixed(2)}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Highest Score</TableCell>
                                            <TableCell align="right">{player.statistics.batting.highest_score}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Centuries</TableCell>
                                            <TableCell align="right">{player.statistics.batting.centuries}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Half Centuries</TableCell>
                                            <TableCell align="right">{player.statistics.batting.fifties}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Grid>

                        {/* Bowling Stats */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>
                                Bowling Statistics
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableBody>
                                        <TableRow>
                                            <TableCell>Wickets</TableCell>
                                            <TableCell align="right">{player.statistics.bowling.wickets}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Economy</TableCell>
                                            <TableCell align="right">{player.statistics.bowling.economy.toFixed(2)}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Average</TableCell>
                                            <TableCell align="right">{player.statistics.bowling.average.toFixed(2)}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Best Figures</TableCell>
                                            <TableCell align="right">{player.statistics.bowling.best_figures}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>5 Wicket Hauls</TableCell>
                                            <TableCell align="right">{player.statistics.bowling.five_wickets}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* Achievements Tab */}
                <TabPanel value={tabValue} index={1}>
                    <List>
                        {player.statistics.achievements.map((achievement, index) => (
                            <React.Fragment key={index}>
                                <ListItem>
                                    <ListItemText
                                        primary={achievement.title}
                                        secondary={
                                            <>
                                                <Typography component="span" variant="body2">
                                                    {achievement.tournament}
                                                </Typography>
                                                <br />
                                                <Typography component="span" variant="body2" color="textSecondary">
                                                    {achievement.description}
                                                </Typography>
                                            </>
                                        }
                                    />
                                </ListItem>
                                {index < player.statistics.achievements.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                </TabPanel>

                {/* Career History Tab */}
                <TabPanel value={tabValue} index={2}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Season</TableCell>
                                    <TableCell>Team</TableCell>
                                    <TableCell>Tournament</TableCell>
                                    <TableCell align="right">Matches</TableCell>
                                    <TableCell align="right">Performance</TableCell>
                                    <TableCell align="right">Price</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {player.history.map((entry) => (
                                    <TableRow key={entry.season}>
                                        <TableCell>{entry.season}</TableCell>
                                        <TableCell>{entry.team_name}</TableCell>
                                        <TableCell>{entry.tournament_name}</TableCell>
                                        <TableCell align="right">{entry.matches_played}</TableCell>
                                        <TableCell align="right">{entry.performance_rating}</TableCell>
                                        <TableCell align="right">{formatCurrency(entry.price)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </TabPanel>
            </Paper>
        </Container>
    );
};

export default PlayerDetails;