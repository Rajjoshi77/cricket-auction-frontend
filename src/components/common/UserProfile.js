import React, { useState, useEffect } from 'react';
import {
    Box,
    Avatar,
    Menu,
    MenuItem,
    IconButton,
    Typography,
    Chip,
    Divider,
    Badge
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Add API URL constant
const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;

const UserProfile = () => {
    const { logout } = useAuth();
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const storedUser = localStorage.getItem('user');

                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);

                    // Fetch latest user data from API
                    const response = await axios.get(
                        `${API_URL}/users/${parsedUser.id}`,
                        {
                            headers: { Authorization: `Bearer ${token}` }
                        }
                    );

                    // Update localStorage with fresh data
                    localStorage.setItem('user', JSON.stringify(response.data));
                    setUser(response.data);
                }
            } catch (error) {
                console.error('Error fetching user profile:', error);
                setError(error.response?.data?.message || 'Error loading profile');
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, []);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        handleClose();
        logout();
        navigate('/login');
    };

    const handleUpdateAvatar = async (event) => {
        try {
            const file = event.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('avatar', file);

            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/users/avatar`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            // Update user data with new avatar URL
            const updatedUser = { ...user, profile_image: response.data.profile_image };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
        } catch (error) {
            console.error('Error updating avatar:', error);
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin':
                return 'error';
            case 'team_owner':
                return 'primary';
            default:
                return 'default';
        }
    };

    const formatRole = (role) => {
        return role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    if (loading || !user) return null;

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
                label={formatRole(user.role)}
                color={getRoleColor(user.role)}
                size="small"
                sx={{ height: 24 }}
            />
            <IconButton onClick={handleClick} sx={{ p: 0 }}>
                <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                        <input
                            accept="image/*"
                            type="file"
                            onChange={handleUpdateAvatar}
                            style={{ display: 'none' }}
                            id="avatar-upload"
                        />
                    }
                >
                    <Avatar
                        alt={user.username}
                        src={user.profile_image || '/default-avatar.png'}
                        sx={{
                            width: 40,
                            height: 40,
                            border: '2px solid',
                            borderColor: theme => theme.palette[getRoleColor(user.role)].main,
                            cursor: 'pointer'
                        }}
                    />
                </Badge>
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                onClick={handleClose}
                PaperProps={{
                    sx: {
                        minWidth: 200,
                        mt: 1.5,
                    }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <Box sx={{ px: 2, py: 1 }}>
                    <Typography variant="subtitle1" noWrap>
                        {user.username}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                        {user.email}
                    </Typography>
                </Box>
                <Divider />
                <MenuItem onClick={() => navigate('/profile')}>
                    My Profile
                </MenuItem>
                {user.role === 'team_owner' && (
                    <MenuItem onClick={() => navigate('/teams/my-team')}>
                        My Team
                    </MenuItem>
                )}
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                    Logout
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default UserProfile;