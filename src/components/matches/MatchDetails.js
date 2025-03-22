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
    Divider,
    List,
    ListItem,
    ListItemText
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
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

const MatchDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [match, setMatch] = useState(null);
    const [tabValue, setTabValue] = useState(0);

    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchMatchDetails = async () => {
            try {
                const config = {
                    headers: { Authorization: `Bearer ${token}` }
                };
                const [matchRes, scoreRes, statsRes] = await Promise.all([
                    axios.get(`${API_URL}/matches/${id}`, config),
                    axios.get(`${API_URL}/matches/${id}/score`, config),
                    axios.get(`${API_URL}/matches/${id}/stats`, config)
                ]);

                setMatch({
                    ...matchRes.data,
                    score: scoreRes.data,
                    statistics: statsRes.data
                });
            } catch (error) {
                setError(error.response?.data?.message || 'Error fetching match details');
            } finally {
                setLoading(false);
            }
        };

        fetchMatchDetails();
    }, [id, token]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const getMatchStatusColor = (status) => {
        switch (status) {
            case 'upcoming':
                return 'info';
            case 'live':
                return 'success';
            case 'completed':
                return 'default';
            default:
                return 'default';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!match) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Alert severity="error">Match not found</Alert>
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

            {/* Match Header */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h4" component="h1">
                                {match.team1_name} vs {match.team2_name}
                            </Typography>
                            <Chip
                                label={match.status}
                                color={getMatchStatusColor(match.status)}
                            />
                        </Box>
                        <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                            {formatDate(match.match_date)}
                        </Typography>
                        <Typography variant="subtitle1">
                            {match.venue}
                        </Typography>
                        {match.winner_name && (
                            <Typography variant="h6" sx={{ mt: 2, color: 'success.main' }}>
                                {match.winner_name} won the match
                            </Typography>
                        )}
                    </Grid>
                </Grid>
            </Paper>

            {/* Score Card (visible only for live/completed matches) */}
            {match.status !== 'upcoming' && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Score Card
                    </Typography>
                    <Grid container spacing={4}>
                        {/* Team 1 Score */}
                        <Grid item xs={12} md={6}>
                            <Paper elevation={2} sx={{ p: 2 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    {match.team1_name}
                                </Typography>
                                <Typography variant="h4">
                                    {match.score.team1_score}/{match.score.team1_wickets}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Overs: {match.score.team1_overs}
                                </Typography>
                            </Paper>
                        </Grid>
                        {/* Team 2 Score */}
                        <Grid item xs={12} md={6}>
                            <Paper elevation={2} sx={{ p: 2 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    {match.team2_name}
                                </Typography>
                                <Typography variant="h4">
                                    {match.score.team2_score}/{match.score.team2_wickets}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Overs: {match.score.team2_overs}
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            {/* Tabs Navigation */}
            <Paper sx={{ mb: 3 }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab label="Playing XI" />
                    <Tab label="Batting Stats" />
                    <Tab label="Bowling Stats" />
                    {match.status !== 'upcoming' && <Tab label="Highlights" />}
                </Tabs>

                {/* Playing XI Tab */}
                <TabPanel value={tabValue} index={0}>
                    <Grid container spacing={3}>
                        {/* Team 1 Playing XI */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>
                                {match.team1_name}
                            </Typography>
                            <List>
                                {match.team1_players?.map((player) => (
                                    <ListItem key={player.player_id}>
                                        <ListItemText
                                            primary={`${player.first_name} ${player.last_name}`}
                                            secondary={player.role}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Grid>
                        {/* Team 2 Playing XI */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>
                                {match.team2_name}
                            </Typography>
                            <List>
                                {match.team2_players?.map((player) => (
                                    <ListItem key={player.player_id}>
                                        <ListItemText
                                            primary={`${player.first_name} ${player.last_name}`}
                                            secondary={player.role}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* Batting Stats Tab */}
                <TabPanel value={tabValue} index={1}>
                    <Grid container spacing={3}>
                        {/* Team 1 Batting */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                {match.team1_name} Batting
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Batsman</TableCell>
                                            <TableCell align="right">Runs</TableCell>
                                            <TableCell align="right">Balls</TableCell>
                                            <TableCell align="right">4s</TableCell>
                                            <TableCell align="right">6s</TableCell>
                                            <TableCell align="right">SR</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {match.statistics?.team1_batting.map((stat) => (
                                            <TableRow key={stat.player_id}>
                                                <TableCell>{stat.player_name}</TableCell>
                                                <TableCell align="right">{stat.runs}</TableCell>
                                                <TableCell align="right">{stat.balls}</TableCell>
                                                <TableCell align="right">{stat.fours}</TableCell>
                                                <TableCell align="right">{stat.sixes}</TableCell>
                                                <TableCell align="right">
                                                    {((stat.runs / stat.balls) * 100).toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Grid>
                        <Grid item xs={12}>
                            <Divider sx={{ my: 2 }} />
                        </Grid>
                        {/* Team 2 Batting */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                {match.team2_name} Batting
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Batsman</TableCell>
                                            <TableCell align="right">Runs</TableCell>
                                            <TableCell align="right">Balls</TableCell>
                                            <TableCell align="right">4s</TableCell>
                                            <TableCell align="right">6s</TableCell>
                                            <TableCell align="right">SR</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {match.statistics?.team2_batting.map((stat) => (
                                            <TableRow key={stat.player_id}>
                                                <TableCell>{stat.player_name}</TableCell>
                                                <TableCell align="right">{stat.runs}</TableCell>
                                                <TableCell align="right">{stat.balls}</TableCell>
                                                <TableCell align="right">{stat.fours}</TableCell>
                                                <TableCell align="right">{stat.sixes}</TableCell>
                                                <TableCell align="right">
                                                    {((stat.runs / stat.balls) * 100).toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* Bowling Stats Tab */}
                <TabPanel value={tabValue} index={2}>
                    <Grid container spacing={3}>
                        {/* Team 1 Bowling */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                {match.team1_name} Bowling
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Bowler</TableCell>
                                            <TableCell align="right">Overs</TableCell>
                                            <TableCell align="right">Maidens</TableCell>
                                            <TableCell align="right">Runs</TableCell>
                                            <TableCell align="right">Wickets</TableCell>
                                            <TableCell align="right">Economy</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {match.statistics?.team1_bowling.map((stat) => (
                                            <TableRow key={stat.player_id}>
                                                <TableCell>{stat.player_name}</TableCell>
                                                <TableCell align="right">{stat.overs}</TableCell>
                                                <TableCell align="right">{stat.maidens}</TableCell>
                                                <TableCell align="right">{stat.runs}</TableCell>
                                                <TableCell align="right">{stat.wickets}</TableCell>
                                                <TableCell align="right">
                                                    {(stat.runs / stat.overs).toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Grid>
                        <Grid item xs={12}>
                            <Divider sx={{ my: 2 }} />
                        </Grid>
                        {/* Team 2 Bowling */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                {match.team2_name} Bowling
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Bowler</TableCell>
                                            <TableCell align="right">Overs</TableCell>
                                            <TableCell align="right">Maidens</TableCell>
                                            <TableCell align="right">Runs</TableCell>
                                            <TableCell align="right">Wickets</TableCell>
                                            <TableCell align="right">Economy</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {match.statistics?.team2_bowling.map((stat) => (
                                            <TableRow key={stat.player_id}>
                                                <TableCell>{stat.player_name}</TableCell>
                                                <TableCell align="right">{stat.overs}</TableCell>
                                                <TableCell align="right">{stat.maidens}</TableCell>
                                                <TableCell align="right">{stat.runs}</TableCell>
                                                <TableCell align="right">{stat.wickets}</TableCell>
                                                <TableCell align="right">
                                                    {(stat.runs / stat.overs).toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* Highlights Tab */}
                {match.status !== 'upcoming' && (
                    <TabPanel value={tabValue} index={3}>
                        <List>
                            {match.statistics?.highlights.map((highlight, index) => (
                                <ListItem key={index}>
                                    <ListItemText
                                        primary={highlight.description}
                                        secondary={`Over ${highlight.over}`}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </TabPanel>
                )}
            </Paper>

            {/* Navigation Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                    variant="outlined"
                    onClick={() => navigate(`/tournaments/${match.tournament_id}`)}
                >
                    Back to Tournament
                </Button>
                {user.role === 'admin' && match.status === 'upcoming' && (
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate(`/matches/${id}/edit`)}
                    >
                        Edit Match Details
                    </Button>
                )}
            </Box>
        </Container>
    );
};

export default MatchDetails;