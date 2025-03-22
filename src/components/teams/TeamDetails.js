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
    Avatar,
    Card,
    CardContent,
    Chip,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    ListItemSecondaryAction
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit as EditIcon, Person as PersonIcon } from '@mui/icons-material';
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

const TeamDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [team, setTeam] = useState(null);
    const [tabValue, setTabValue] = useState(0);

    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchTeamDetails = async () => {
            try {
                const config = {
                    headers: { Authorization: `Bearer ${token}` }
                };
                const [teamRes, statsRes, tournamentsRes] = await Promise.all([
                    axios.get(`${API_URL}/teams/${id}`, config),
                    axios.get(`${API_URL}/teams/${id}/stats`, config),
                    axios.get(`${API_URL}/teams/${id}/tournaments`, config)
                ]);

                setTeam({
                    ...teamRes.data,
                    statistics: statsRes.data,
                    tournaments: tournamentsRes.data
                });
            } catch (error) {
                setError(error.response?.data?.message || 'Error fetching team details');
            } finally {
                setLoading(false);
            }
        };

        fetchTeamDetails();
    }, [id, token]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!team) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Alert severity="error">Team not found</Alert>
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

            {/* Team Header */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={2}>
                        <Avatar
                            src={team.team_logo_url}
                            alt={team.team_name}
                            sx={{ width: 120, height: 120 }}
                        >
                            {team.team_name[0]}
                        </Avatar>
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <Typography variant="h4" component="h1" gutterBottom>
                            {team.team_name}
                        </Typography>
                        <Typography variant="subtitle1" color="textSecondary">
                            Owner: {team.owner_name}
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 1 }}>
                            {team.description || 'No team description available.'}
                        </Typography>
                    </Grid>
                    {(user.role === 'admin' || user.id === team.owner_id) && (
                        <Grid item xs={12} md={2} sx={{ textAlign: 'right' }}>
                            <IconButton
                                color="primary"
                                onClick={() => navigate(`/teams/${id}/edit`)}
                            >
                                <EditIcon />
                            </IconButton>
                        </Grid>
                    )}
                </Grid>
            </Paper>

            {/* Team Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total Players
                            </Typography>
                            <Typography variant="h4">
                                {team.statistics.total_players}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Tournaments Played
                            </Typography>
                            <Typography variant="h4">
                                {team.statistics.tournaments_played}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Matches Won
                            </Typography>
                            <Typography variant="h4">
                                {team.statistics.matches_won}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Available Budget
                            </Typography>
                            <Typography variant="h4">
                                {formatCurrency(team.available_budget)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Tabs Navigation */}
            <Paper sx={{ mb: 3 }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab label="Players" />
                    <Tab label="Tournaments" />
                    <Tab label="Statistics" />
                </Tabs>

                {/* Players Tab */}
                <TabPanel value={tabValue} index={0}>
                    <List>
                        {team.players?.map((player) => (
                            <ListItem
                                key={player.player_id}
                                sx={{
                                    '&:hover': {
                                        backgroundColor: 'action.hover',
                                        cursor: 'pointer'
                                    }
                                }}
                                onClick={() => navigate(`/players/${player.player_id}`)}
                            >
                                <ListItemAvatar>
                                    <Avatar>
                                        <PersonIcon />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={`${player.first_name} ${player.last_name}`}
                                    secondary={
                                        <>
                                            <Typography component="span" variant="body2">
                                                {player.role} • {player.specialization}
                                            </Typography>
                                            <br />
                                            <Typography component="span" variant="body2" color="textSecondary">
                                                Base Price: {formatCurrency(player.base_price)}
                                            </Typography>
                                        </>
                                    }
                                />
                                <ListItemSecondaryAction>
                                    <Chip
                                        label={player.status}
                                        color={player.status === 'active' ? 'success' : 'default'}
                                        size="small"
                                    />
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                </TabPanel>

                {/* Tournaments Tab */}
                <TabPanel value={tabValue} index={1}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Tournament</TableCell>
                                    <TableCell>Season</TableCell>
                                    <TableCell>Duration</TableCell>
                                    <TableCell align="right">Matches</TableCell>
                                    <TableCell align="right">Position</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {team.tournaments?.map((tournament) => (
                                    <TableRow key={tournament.tournament_id}>
                                        <TableCell>{tournament.tournament_name}</TableCell>
                                        <TableCell>{tournament.season_year}</TableCell>
                                        <TableCell>
                                            {formatDate(tournament.start_date)} - {formatDate(tournament.end_date)}
                                        </TableCell>
                                        <TableCell align="right">
                                            {tournament.matches_played}
                                        </TableCell>
                                        <TableCell align="right">
                                            {tournament.position || '-'}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Button
                                                size="small"
                                                onClick={() => navigate(`/tournaments/${tournament.tournament_id}`)}
                                            >
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </TabPanel>

                {/* Statistics Tab */}
                <TabPanel value={tabValue} index={2}>
                    <Grid container spacing={3}>
                        {/* Team Performance */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>
                                Team Performance
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableBody>
                                        <TableRow>
                                            <TableCell>Total Matches</TableCell>
                                            <TableCell align="right">{team.statistics.total_matches}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Matches Won</TableCell>
                                            <TableCell align="right">{team.statistics.matches_won}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Win Percentage</TableCell>
                                            <TableCell align="right">
                                                {((team.statistics.matches_won / team.statistics.total_matches) * 100).toFixed(1)}%
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Tournaments Won</TableCell>
                                            <TableCell align="right">{team.statistics.tournaments_won}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Grid>

                        {/* Top Performers */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>
                                Top Performers
                            </Typography>
                            <List>
                                {team.statistics.top_performers?.map((player, index) => (
                                    <ListItem key={index}>
                                        <ListItemText
                                            primary={`${player.first_name} ${player.last_name}`}
                                            secondary={
                                                <>
                                                    <Typography component="span" variant="body2">
                                                        {player.achievement_type}
                                                    </Typography>
                                                    <br />
                                                    <Typography component="span" variant="body2" color="textSecondary">
                                                        {player.achievement_details}
                                                    </Typography>
                                                </>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Grid>
                    </Grid>
                </TabPanel>
            </Paper>
        </Container>
    );
};

export default TeamDetails;