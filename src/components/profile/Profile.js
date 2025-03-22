import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Grid,
    Avatar,
    Box,
    Button,
    TextField,
    Alert,
    CircularProgress,
    Divider,
    Chip
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Profile.css';

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;

const Profile = () => {
    const navigate = useNavigate();
    const { user: authUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [profileData, setProfileData] = useState({
        id: '',
        username: '',
        email: '',
        role: '',
        created_at: '',
        updated_at: ''
    });
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                setLoading(true);
                setError('');
                const token = localStorage.getItem('token');
                const storedUser = JSON.parse(localStorage.getItem('user'));

                if (!token || !storedUser) {
                    setError('Authentication required');
                    navigate('/login');
                    return;
                }

                console.log('Stored user:', storedUser);
                const response = await axios.get(
                    `${API_URL}/users/${storedUser.id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                console.log('Profile response:', response.data);
                if (response.data) {
                    setProfileData(response.data);
                } else {
                    setError('No profile data received');
                }
            } catch (err) {
                console.error('Profile fetch error:', err);
                if (err.response?.status === 401) {
                    navigate('/login');
                    return;
                }
                setError(
                    err.response?.data?.message ||
                    err.response?.data?.error ||
                    'Failed to fetch profile data'
                );
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError('');
            setSuccess('');

            const token = localStorage.getItem('token');
            const userId = authUser?.id;

            if (!token || !userId) {
                setError('Authentication required');
                navigate('/login');
                return;
            }

            await axios.put(
                `${API_URL}/users/${userId}`,
                {
                    username: profileData.username,
                    email: profileData.email
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            setSuccess('Profile updated successfully');
            setIsEditing(false);
        } catch (err) {
            console.error('Profile update error:', err);
            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                'Failed to update profile'
            );
            if (err.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const getRoleColor = (role) => {
        switch (role?.toLowerCase()) {
            case 'admin':
                return 'error';
            case 'team_owner':
                return 'primary';
            default:
                return 'primary';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <div className="card-container">
                <div className="card">
                    <div className="card-content">
                        <div className="card-front">
                            <div className="profile-header">
                                <div className="profile-avatar">
                                    {profileData.username?.[0]?.toUpperCase() || '?'}
                                </div>
                                <Typography variant="h4" className="username">
                                    {profileData.username || 'User'}
                                </Typography>
                                <div className="role-badge">
                                    {profileData.role?.replace('_', ' ').toUpperCase() || 'USER'}
                                </div>
                            </div>
                            <div className="profile-details">
                                <div className="detail-item">
                                    <span className="label">Email:</span>
                                    <span className="value">{profileData.email}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Member Since:</span>
                                    <span className="value">{formatDate(profileData.created_at)}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Role:</span>
                                    <span className="value">
                                        {profileData.role?.replace('_', ' ').toUpperCase() || 'USER'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Paper sx={{ p: 4, mt: 4 }}>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Username"
                                name="username"
                                value={profileData.username || ''}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Email"
                                name="email"
                                value={profileData.email || ''}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                type="email"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Role"
                                value={(profileData.role || '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                disabled
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Member Since"
                                value={formatDate(profileData.created_at)}
                                disabled
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Last Updated"
                                value={formatDate(profileData.updated_at)}
                                disabled
                            />
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        {isEditing ? (
                            <>
                                <Button
                                    variant="outlined"
                                    onClick={() => setIsEditing(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="contained"
                                    type="submit"
                                    disabled={loading}
                                >
                                    Save Changes
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="contained"
                                onClick={() => setIsEditing(true)}
                            >
                                Edit Profile
                            </Button>
                        )}
                    </Box>
                </form>

                {profileData.role === 'team_owner' && (
                    <>
                        <Divider sx={{ my: 3 }} />
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                Team Information
                            </Typography>
                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={() => navigate('/my-team')}
                            >
                                View My Team
                            </Button>
                        </Box>
                    </>
                )}
            </Paper>
        </Container>
    );
};

export default Profile;