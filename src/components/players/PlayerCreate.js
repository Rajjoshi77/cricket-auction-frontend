import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Box
} from '@mui/material';
import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;

const PlayerCreate = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        age: '',
        country: '',
        role: '',
        specialization: '',
        base_price: '',
        profile_image_url: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const dataToSubmit = {
                ...formData,
                age: parseInt(formData.age, 10),
                base_price: parseFloat(formData.base_price)
            };

            await axios.post(
                `${API_URL}/players`,
                dataToSubmit,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            navigate('/players');
        } catch (error) {
            console.error('Error details:', error.response?.data);
            setError(error.response?.data?.errors?.join(', ') || error.response?.data?.message || 'Error creating player');
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Add New Player
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                fullWidth
                                label="First Name"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                fullWidth
                                label="Last Name"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                fullWidth
                                label="Age"
                                name="age"
                                type="number"
                                value={formData.age}
                                onChange={handleChange}
                                inputProps={{ min: 16, max: 50 }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                fullWidth
                                label="Country"
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Role</InputLabel>
                                <Select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    label="Role"
                                >
                                    <MenuItem value="batsman">Batsman</MenuItem>
                                    <MenuItem value="bowler">Bowler</MenuItem>
                                    <MenuItem value="all_rounder">All Rounder</MenuItem>
                                    <MenuItem value="wicket_keeper">Wicket Keeper</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Specialization</InputLabel>
                                <Select
                                    name="specialization"
                                    value={formData.specialization}
                                    onChange={handleChange}
                                    label="Specialization"
                                >
                                    <MenuItem value="right_handed">Right Handed</MenuItem>
                                    <MenuItem value="left_handed">Left Handed</MenuItem>
                                    <MenuItem value="fast">Fast</MenuItem>
                                    <MenuItem value="spin">Spin</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                fullWidth
                                label="Base Price"
                                name="base_price"
                                type="number"
                                value={formData.base_price}
                                onChange={handleChange}
                                inputProps={{ min: 0, step: 100000 }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Profile Image URL"
                                name="profile_image_url"
                                value={formData.profile_image_url}
                                onChange={handleChange}
                            />
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            type="submit"
                        >
                            Create Player
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/players')}
                        >
                            Cancel
                        </Button>
                    </Box>
                </form>
            </Paper>
        </Container>
    );
};

export default PlayerCreate;