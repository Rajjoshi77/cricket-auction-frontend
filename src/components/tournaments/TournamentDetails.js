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
    Avatar
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowBack } from '@mui/icons-material';

// Tab Panel Component
function TabPanel({ children, value, index }) {
    return (
        <div hidden={value !== index} style={{ paddingTop: '20px' }}>
            {value === index && children}
        </div>
    );
}

const TournamentDetails = () => {
    const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;
    const { id } = useParams();
    const navigate = useNavigate();
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [tournament, setTournament] = useState({
        tournament_name: '',
        season_year: '',
        start_date: '',
        end_date: '',
        registration_deadline: '',
        venue: '',
        description: '',
        status: '',
        teams: [],
        matches: [],
        statistics: {
            team_statistics: [],
            top_batsmen: [],
            top_bowlers: []
        }
    });

    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchTournamentDetails = async () => {
            setLoading(true);
            setError('');

            try {
                console.log(`Fetching details for tournament ID: ${id}`);
                if (!token) {
                    console.error('No authentication token found');
                    setError('Authentication required. Please log in.');
                    setLoading(false);
                    return;
                }

                // Log auth token (truncated for security)
                const truncatedToken = token.substring(0, 10) + '...';
                console.log(`Using auth token: ${truncatedToken}`);

                const config = {
                    headers: { Authorization: `Bearer ${token}` }
                };
                console.log('API URL:', `${API_URL}/tournaments/${id}`);
                console.log('Request config:', {
                    method: 'GET',
                    headers: { Authorization: 'Bearer [TRUNCATED]' }
                });

                const tournamentRes = await axios.get(`${API_URL}/tournaments/${id}`, config);
                console.log('Tournament data received:', tournamentRes.data);

                // Ensure all properties are present with defaults
                const defaultValues = {
                    tournament_name: '',
                    season_year: '',
                    start_date: '',
                    end_date: '',
                    registration_deadline: '',
                    venue: '',
                    description: '',
                    status: '',
                    teams: [],
                    matches: [],
                    statistics: {
                        team_statistics: [],
                        top_batsmen: [],
                        top_bowlers: []
                    }
                };

                const tournamentData = {
                    ...defaultValues,
                    ...tournamentRes.data, // Override with actual data
                    teams: tournamentRes.data.teams || [],
                    matches: tournamentRes.data.matches || [],
                    statistics: tournamentRes.data.statistics || {
                        team_statistics: [],
                        top_batsmen: [],
                        top_bowlers: []
                    }
                };

                setTournament(tournamentData);
            } catch (error) {
                console.error('Error fetching tournament details:', error);
                console.error('Error response:', error.response?.data || error.message);
                console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
                setError(error.response?.data?.message || 'Error fetching tournament details. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchTournamentDetails();
        }
    }, [id, token, API_URL]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getStatusChip = (status) => {
        if (!status) return <Chip label="Unknown" color="default" />;

        let color;
        switch (status.toLowerCase()) {
            case 'upcoming':
                color = 'info';
                break;
            case 'active':
                color = 'success';
                break;
            case 'completed':
                color = 'default';
                break;
            default:
                color = 'default';
        }
        return <Chip label={status} color={color} sx={{ ml: 2 }} />;
    };

    const user = JSON.parse(localStorage.getItem('user'));

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!tournament) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Alert severity="error">Tournament not found</Alert>
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

            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    <Paper sx={{ p: 2, mb: 2 }}>
                        <Box display="flex" alignItems="center" mb={2}>
                            <Button
                                startIcon={<ArrowBack />}
                                onClick={() => navigate('/tournaments')}
                                sx={{ mr: 2 }}
                            >
                                Back to Tournaments
                            </Button>
                            <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
                                {tournament.tournament_name}
                            </Typography>
                            {getStatusChip(tournament.status)}
                        </Box>

                        <Grid container spacing={2}>
                            <Grid item xs={12} md={8}>
                                <Grid container spacing={3}>
                                    <Grid item xs={6}>
                                        <Typography color="textSecondary">Season</Typography>
                                        <Typography variant="body1">
                                            {tournament.season_year || 'N/A'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography color="textSecondary">Venue</Typography>
                                        <Typography variant="body1">
                                            {tournament.venue || 'N/A'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography color="textSecondary">Start Date</Typography>
                                        <Typography variant="body1">
                                            {formatDate(tournament.start_date)}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography color="textSecondary">End Date</Typography>
                                        <Typography variant="body1">
                                            {formatDate(tournament.end_date)}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography color="textSecondary">Description</Typography>
                                        <Typography variant="body1">
                                            {tournament.description || 'No description available.'}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Grid>

                            {user && user.role === 'admin' && (
                                <Grid item xs={12} md={4} sx={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={() => navigate(`/tournaments/${id}/edit`)}
                                        fullWidth
                                    >
                                        Edit Tournament
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        onClick={() => navigate(`/tournaments/${id}/manage-matches`)}
                                        fullWidth
                                    >
                                        Manage Matches
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="info"
                                        onClick={() => navigate(`/tournaments/${id}/auction`)}
                                        fullWidth
                                    >
                                        Manage Auction
                                    </Button>
                                </Grid>
                            )}
                        </Grid>
                    </Paper>

                    {/* Tabs Navigation */}
                    <Paper sx={{ mb: 3 }}>
                        <Tabs value={tabValue} onChange={handleTabChange}>
                            <Tab label="Teams" />
                            <Tab label="Matches" />
                            <Tab label="Statistics" />
                        </Tabs>

                        {/* Teams Tab */}
                        <TabPanel value={tabValue} index={0}>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Team</TableCell>
                                            <TableCell>Owner</TableCell>
                                            <TableCell align="right">Players</TableCell>
                                            <TableCell align="right">Budget Remaining</TableCell>
                                            <TableCell align="right">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {(tournament.teams || []).map((team, index) => (
                                            <TableRow key={team.team_id || `team-${index}`}>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <Avatar src={team.team_logo_url} sx={{ mr: 2 }}>
                                                            {team.team_name?.[0] || 'T'}
                                                        </Avatar>
                                                        {team.team_name || 'Unnamed Team'}
                                                    </Box>
                                                </TableCell>
                                                <TableCell>{team.owner_name || 'Unknown'}</TableCell>
                                                <TableCell align="right">{team.total_players || 0}</TableCell>
                                                <TableCell align="right">₹{team.remaining_budget || 0}</TableCell>
                                                <TableCell align="right">
                                                    <Button
                                                        size="small"
                                                        onClick={() => navigate(`/teams/${team.team_id}`)}
                                                    >
                                                        View Team
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {(!tournament.teams || tournament.teams.length === 0) && (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center">
                                                    No teams registered yet
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </TabPanel>

                        {/* Matches Tab */}
                        <TabPanel value={tabValue} index={1}>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Date</TableCell>
                                            <TableCell>Teams</TableCell>
                                            <TableCell>Venue</TableCell>
                                            <TableCell>Result</TableCell>
                                            <TableCell align="right">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {(tournament.matches || []).map((match, index) => (
                                            <TableRow key={match.match_id || `match-${index}`}>
                                                <TableCell>{formatDate(match.match_date)}</TableCell>
                                                <TableCell>
                                                    {match.team1_name} vs {match.team2_name}
                                                </TableCell>
                                                <TableCell>{match.venue}</TableCell>
                                                <TableCell>
                                                    {match.winner_name
                                                        ? `${match.winner_name} won`
                                                        : 'Upcoming'}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Button
                                                        size="small"
                                                        onClick={() => navigate(`/matches/${match.match_id}`)}
                                                    >
                                                        View Details
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {(!tournament.matches || tournament.matches.length === 0) && (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center">
                                                    No matches scheduled yet
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </TabPanel>

                        {/* Statistics Tab */}
                        <TabPanel value={tabValue} index={2}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="h6" gutterBottom>
                                        Team Standings
                                    </Typography>
                                    <TableContainer>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Team</TableCell>
                                                    <TableCell align="right">P</TableCell>
                                                    <TableCell align="right">W</TableCell>
                                                    <TableCell align="right">L</TableCell>
                                                    <TableCell align="right">Points</TableCell>
                                                    <TableCell align="right">NRR</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {tournament.statistics?.team_statistics &&
                                                    tournament.statistics.team_statistics.length > 0 ? (
                                                    tournament.statistics.team_statistics.map((stat) => (
                                                        <TableRow key={stat.team_id}>
                                                            <TableCell>{stat.team_name}</TableCell>
                                                            <TableCell align="right">{stat.matches_played}</TableCell>
                                                            <TableCell align="right">{stat.matches_won}</TableCell>
                                                            <TableCell align="right">{stat.matches_lost}</TableCell>
                                                            <TableCell align="right">{stat.points}</TableCell>
                                                            <TableCell align="right">
                                                                {stat.net_run_rate.toFixed(3)}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={6} align="center">
                                                            No team statistics available
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Typography variant="h6" gutterBottom>
                                        Top Performers
                                    </Typography>
                                    <Paper sx={{ p: 2, mb: 2 }}>
                                        <Typography variant="subtitle1" gutterBottom>
                                            Top Batsmen
                                        </Typography>
                                        <Table size="small">
                                            <TableBody>
                                                {tournament.statistics?.top_batsmen &&
                                                    tournament.statistics.top_batsmen.length > 0 ? (
                                                    tournament.statistics.top_batsmen.map((player) => (
                                                        <TableRow key={player.player_id}>
                                                            <TableCell>
                                                                {player.first_name} {player.last_name}
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                {player.runs_scored} runs
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                Avg: {player.batting_average.toFixed(2)}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={3} align="center">
                                                            No batting statistics available
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </Paper>

                                    <Paper sx={{ p: 2 }}>
                                        <Typography variant="subtitle1" gutterBottom>
                                            Top Bowlers
                                        </Typography>
                                        <Table size="small">
                                            <TableBody>
                                                {tournament.statistics?.top_bowlers &&
                                                    tournament.statistics.top_bowlers.length > 0 ? (
                                                    tournament.statistics.top_bowlers.map((player) => (
                                                        <TableRow key={player.player_id}>
                                                            <TableCell>
                                                                {player.first_name} {player.last_name}
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                {player.wickets_taken} wickets
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                Avg: {player.bowling_average.toFixed(2)}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={3} align="center">
                                                            No bowling statistics available
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </TabPanel>
                    </Paper>
                </>
            )}
        </Container>
    );
};

export default TournamentDetails;