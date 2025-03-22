import React, { useState } from 'react';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    Alert,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;

const AuctionCreate = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        status: 'upcoming',
        min_bid: 100,
        bid_increment: 50
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_URL}/auctions`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            setSuccess('Auction created successfully!');
            setTimeout(() => {
                navigate('/auctions');
            }, 2000);
        } catch (err) {
            console.error('Error creating auction:', err);
            setError(err.response?.data?.message || 'Error creating auction');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Create New Auction
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {success}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="Auction Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        fullWidth
                        label="Description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        multiline
                        rows={4}
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        fullWidth
                        label="Start Date"
                        name="start_date"
                        type="datetime-local"
                        value={formData.start_date}
                        onChange={handleChange}
                        required
                        InputLabelProps={{ shrink: true }}
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        fullWidth
                        label="End Date"
                        name="end_date"
                        type="datetime-local"
                        value={formData.end_date}
                        onChange={handleChange}
                        required
                        InputLabelProps={{ shrink: true }}
                        sx={{ mb: 2 }}
                    />

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            required
                        >
                            <MenuItem value="upcoming">Upcoming</MenuItem>
                            <MenuItem value="ongoing">Ongoing</MenuItem>
                            <MenuItem value="completed">Completed</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        fullWidth
                        label="Minimum Bid Amount"
                        name="min_bid"
                        type="number"
                        value={formData.min_bid}
                        onChange={handleChange}
                        required
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        fullWidth
                        label="Bid Increment"
                        name="bid_increment"
                        type="number"
                        value={formData.bid_increment}
                        onChange={handleChange}
                        required
                        sx={{ mb: 3 }}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            type="button"
                            onClick={() => navigate(-1)}
                            sx={{ mr: 2 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Create Auction'}
                        </Button>
                    </Box>
                </form>
            </Paper>
        </Container>
    );
};

export default AuctionCreate;