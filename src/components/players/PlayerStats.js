import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Grid, Typography, CircularProgress, Paper, Alert } from '@mui/material';
import { Line, Bar, Radar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    RadialLinearScale,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    RadialLinearScale,
    Title,
    Tooltip,
    Legend,
    Filler
);

// Add after imports
const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;

const PlayerStats = ({ playerId }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPlayerStats = async () => {
            try {
                setLoading(true);
                setError(null);
                const token = localStorage.getItem('token');

                if (!token) {
                    setError('Authentication token not found');
                    return;
                }

                console.log('Fetching stats for player:', playerId);
                const response = await fetch(
                    `${API_URL}/players/${playerId}/statistics`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json'
                        }
                    }
                );

                console.log('Stats API Response status:', response.status);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('Stats data received:', data);
                setStats(data);
            } catch (err) {
                console.error('Error fetching player statistics:', err);
                setError(err.message || 'Failed to fetch player statistics');
            } finally {
                setLoading(false);
            }
        };

        if (playerId) {
            fetchPlayerStats();
        }
    }, [playerId]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <Alert severity="error" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Box>
        );
    }

    if (!stats) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <Alert severity="info" sx={{ width: '100%' }}>
                    No statistics available for this player
                </Alert>
            </Box>
        );
    }

    // Performance Overview Radar Chart Data
    const performanceData = {
        labels: ['Matches Played', 'Batting Average', 'Bowling Average', 'Wickets'],
        datasets: [{
            label: 'Player Performance',
            data: [
                parseInt(stats.matches_played || 0),
                parseFloat(stats.batting_average || 0),
                parseFloat(stats.bowling_average || 0),
                parseInt(stats.wickets_taken || 0)
            ],
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            fill: true
        }]
    };

    // Batting Stats Line Chart Data
    const battingData = {
        labels: ['Batting Average', 'Runs Scored/10'],
        datasets: [{
            label: 'Batting Statistics',
            data: [
                parseFloat(stats.batting_average || 0),
                (parseInt(stats.runs_scored || 0)) / 10 // Scaled down for better visualization
            ],
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
            fill: true
        }]
    };

    // Bowling Stats Bar Chart Data
    const bowlingData = {
        labels: ['Bowling Average', 'Wickets Taken'],
        datasets: [{
            label: 'Bowling Statistics',
            data: [
                parseFloat(stats.bowling_average || 0),
                parseInt(stats.wickets_taken || 0)
            ],
            backgroundColor: [
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)'
            ],
            borderColor: [
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)'
            ],
            borderWidth: 1
        }]
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Player Statistics
            </Typography>

            <Grid container spacing={3}>
                {/* Key Statistics Cards */}
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Matches Played
                            </Typography>
                            <Typography variant="h4">
                                {stats.matches_played || 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Batting Average
                            </Typography>
                            <Typography variant="h4">
                                {parseFloat(stats.batting_average || 0).toFixed(2)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Bowling Average
                            </Typography>
                            <Typography variant="h4">
                                {parseFloat(stats.bowling_average || 0).toFixed(2)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total Runs
                            </Typography>
                            <Typography variant="h4">
                                {stats.runs_scored || 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Performance Overview Radar Chart */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Overall Performance
                        </Typography>
                        <Box sx={{ height: 300 }}>
                            <Radar
                                data={performanceData}
                                options={{
                                    scales: {
                                        r: {
                                            beginAtZero: true,
                                            suggestedMax: Math.max(
                                                stats.matches_played || 0,
                                                stats.batting_average || 0,
                                                stats.bowling_average || 0,
                                                stats.wickets_taken || 0
                                            )
                                        }
                                    },
                                    plugins: {
                                        legend: {
                                            position: 'top'
                                        }
                                    },
                                    maintainAspectRatio: false
                                }}
                            />
                        </Box>
                    </Paper>
                </Grid>

                {/* Batting Stats Line Chart */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Batting Performance
                        </Typography>
                        <Box sx={{ height: 300 }}>
                            <Line
                                data={battingData}
                                options={{
                                    scales: {
                                        y: {
                                            beginAtZero: true
                                        }
                                    },
                                    plugins: {
                                        legend: {
                                            position: 'top'
                                        }
                                    },
                                    maintainAspectRatio: false
                                }}
                            />
                        </Box>
                    </Paper>
                </Grid>

                {/* Bowling Stats Bar Chart */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Bowling Performance
                        </Typography>
                        <Box sx={{ height: 300 }}>
                            <Bar
                                data={bowlingData}
                                options={{
                                    scales: {
                                        y: {
                                            beginAtZero: true
                                        }
                                    },
                                    plugins: {
                                        legend: {
                                            position: 'top'
                                        }
                                    },
                                    maintainAspectRatio: false
                                }}
                            />
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default PlayerStats;