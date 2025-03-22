import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
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
    MenuItem,
    Avatar,
    IconButton,
    InputAdornment
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { PhotoCamera as PhotoCameraIcon } from '@mui/icons-material';
import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;

const PlayerEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        age: '',
        country: '',
        role: 'batsman',
        specialization: 'right_handed',
        base_price: 100000,
        status: 'available',
        profile_image: null
    });

    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchPlayer = async () => {
            if (!id) {
                setLoading(false);
                return;
            }

            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                };
                const response = await axios.get(`${API_URL}/players/${id}`, config);
                const player = response.data;

                setFormData({
                    first_name: player.first_name || '',
                    last_name: player.last_name || '',
                    age: player.age || '',
                    country: player.country || '',
                    role: player.role || 'batsman',
                    specialization: player.specialization || 'right_handed',
                    base_price: player.base_price || 100000,
                    status: player.status || 'available',
                    profile_image: null
                });
                setImagePreview(player.profile_image_url);
            } catch (error) {
                console.error('Error fetching player:', error);
                setError(error.response?.data?.message || error.message || 'Error fetching player details');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchPlayer();
        } else {
            setError('Unauthorized access. Please log in.');
            setLoading(false);
        }
    }, [id, token]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError('Image size should be less than 5MB');
                return;
            }
            setFormData(prevData => ({
                ...prevData,
                profile_image: file
            }));
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const validateForm = () => {
        if (!formData.first_name?.trim()) return 'First name is required';
        if (!formData.last_name?.trim()) return 'Last name is required';
        if (!formData.age || formData.age < 16) return 'Age must be at least 16';
        if (!formData.country?.trim()) return 'Country is required';
        if (!formData.base_price || formData.base_price < 100000) {
            return 'Base price must be at least ₹100,000';
        }
        return null;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            const submitData = new FormData();

            // Add all form fields
            submitData.append('first_name', formData.first_name.trim());
            submitData.append('last_name', formData.last_name.trim());
            submitData.append('age', formData.age);
            submitData.append('country', formData.country.trim());
            submitData.append('role', formData.role);
            submitData.append('specialization', formData.specialization);
            submitData.append('base_price', formData.base_price);
            submitData.append('status', formData.status);

            // Only append profile image if it's changed
            if (formData.profile_image instanceof File) {
                submitData.append('profile_image', formData.profile_image);
            }

            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json'
                }
            };

            let response;
            if (id) {
                response = await axios.put(`${API_URL}/players/${id}`, submitData, config);
                setSuccess('Player updated successfully');
            } else {
                response = await axios.post(`${API_URL}/players`, submitData, config);
                setSuccess('Player created successfully');
            }

            console.log('Server response:', response.data);

            // Navigate after a short delay to show the success message
            setTimeout(() => {
                navigate(id ? `/players/${id}` : '/players');
            }, 2000);
        } catch (error) {
            console.error('Error saving player:', error);
            setError(error.response?.data?.message || error.message || 'Error saving player');
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    {id ? 'Edit Player' : 'Add New Player'}
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                            <Box sx={{ position: 'relative' }}>
                                <Avatar
                                    src={imagePreview}
                                    sx={{ width: 120, height: 120, mb: 1 }}
                                    alt={formData.first_name ? `${formData.first_name} ${formData.last_name}` : 'Player'}
                                >
                                    {formData.first_name ? formData.first_name[0] : 'P'}
                                </Avatar>
                                <input
                                    accept="image/*"
                                    type="file"
                                    id="profile-image-input"
                                    onChange={handleImageChange}
                                    style={{ display: 'none' }}
                                />
                                <label htmlFor="profile-image-input">
                                    <IconButton
                                        color="primary"
                                        component="span"
                                        sx={{
                                            position: 'absolute',
                                            bottom: 0,
                                            right: 0,
                                            backgroundColor: 'background.paper'
                                        }}
                                    >
                                        <PhotoCameraIcon />
                                    </IconButton>
                                </label>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="First Name"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                required
                                error={!formData.first_name}
                                helperText={!formData.first_name ? 'First name is required' : ''}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Last Name"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                required
                                error={!formData.last_name}
                                helperText={!formData.last_name ? 'Last name is required' : ''}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Age"
                                name="age"
                                type="number"
                                value={formData.age}
                                onChange={handleChange}
                                required
                                inputProps={{ min: 16 }}
                                error={formData.age < 16}
                                helperText={formData.age < 16 ? 'Age must be at least 16' : ''}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Country"
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                required
                                error={!formData.country}
                                helperText={!formData.country ? 'Country is required' : ''}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel id="role-label">Role</InputLabel>
                                <Select
                                    labelId="role-label"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    label="Role"
                                >
                                    <MenuItem value="batsman">Batsman</MenuItem>
                                    <MenuItem value="bowler">Bowler</MenuItem>
                                    <MenuItem value="all_rounder">All-Rounder</MenuItem>
                                    <MenuItem value="wicket_keeper">Wicket Keeper</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel id="specialization-label">Specialization</InputLabel>
                                <Select
                                    labelId="specialization-label"
                                    name="specialization"
                                    value={formData.specialization}
                                    onChange={handleChange}
                                    label="Specialization"
                                >
                                    <MenuItem value="right_handed">Right Handed</MenuItem>
                                    <MenuItem value="left_handed">Left Handed</MenuItem>
                                    <MenuItem value="fast">Fast Bowler</MenuItem>
                                    <MenuItem value="spin">Spin Bowler</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Base Price (₹)"
                                name="base_price"
                                type="number"
                                value={formData.base_price}
                                onChange={handleChange}
                                required
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                    inputProps: { min: 100000 }
                                }}
                                error={formData.base_price < 100000}
                                helperText={formData.base_price < 100000 ? 'Base price must be at least ₹100,000' : ''}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Button
                                variant="contained"
                                color="primary"
                                type="submit"
                                disabled={loading}
                                sx={{ mr: 2 }}
                            >
                                {id ? 'Update Player' : 'Create Player'}
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => navigate('/players')}
                            >
                                Cancel
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Container>
    );
};

export default PlayerEdit;
