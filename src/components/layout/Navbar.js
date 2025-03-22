import React, { useState } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    Container,
    Menu,
    MenuItem,
    IconButton,
    Divider,
    Badge
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import UserProfile from '../common/UserProfile';

// Add API URL constant
const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;

const Navbar = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const navigate = useNavigate();
    const location = useLocation();
    const [anchorEl, setAnchorEl] = useState(null);
    const [notificationCount, setNotificationCount] = useState(0);
    const open = Boolean(anchorEl);

    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleNavigation = (path) => {
        navigate(path);
        handleMenuClose();
    };

    // Add notification handling
    const handleNotificationClick = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/notifications`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const notifications = await response.json();
            setNotificationCount(0);
            // Handle notifications...
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    return (
        <AppBar position="static">
            <Container>
                <Toolbar disableGutters>
                    <Typography
                        variant="h6"
                        component={RouterLink}
                        to="/"
                        sx={{
                            flexGrow: 1,
                            textDecoration: 'none',
                            color: 'inherit'
                        }}
                    >
                        Cricket Auction System
                    </Typography>

                    {/* Desktop Navigation */}
                    <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
                        {user ? (
                            <>
                                <Button
                                    color="inherit"
                                    component={RouterLink}
                                    to="/dashboard"
                                >
                                    Dashboard
                                </Button>
                                <Button
                                    color="inherit"
                                    component={RouterLink}
                                    to="/tournaments"
                                >
                                    Tournaments
                                </Button>
                                <Button
                                    color="inherit"
                                    component={RouterLink}
                                    to="/auctions"
                                >
                                    Auctions
                                </Button>
                                <Button
                                    color="inherit"
                                    component={RouterLink}
                                    to="/players"
                                >
                                    Players
                                </Button>

                                {user.role === 'team_owner' && (
                                    <Button
                                        color="inherit"
                                        component={RouterLink}
                                        to="/teams/my-team"
                                    >
                                        My Team
                                    </Button>
                                )}

                                <IconButton
                                    color="inherit"
                                    onClick={handleNotificationClick}
                                    sx={{ ml: 1 }}
                                >
                                    <Badge badgeContent={notificationCount} color="error">
                                        <NotificationsIcon />
                                    </Badge>
                                </IconButton>

                                <UserProfile />
                            </>
                        ) : (
                            <>
                                <Button
                                    color="inherit"
                                    component={RouterLink}
                                    to="/login"
                                >
                                    Login
                                </Button>
                                <Button
                                    color="inherit"
                                    component={RouterLink}
                                    to="/register"
                                >
                                    Register
                                </Button>
                            </>
                        )}
                    </Box>

                    {/* Mobile Navigation */}
                    <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
                        {user ? (
                            <>
                                <IconButton
                                    color="inherit"
                                    aria-label="menu"
                                    onClick={handleMenuClick}
                                    edge="start"
                                >
                                    <MenuIcon />
                                </IconButton>
                                <Menu
                                    anchorEl={anchorEl}
                                    open={open}
                                    onClose={handleMenuClose}
                                >
                                    <MenuItem onClick={() => handleNavigation('/dashboard')}>
                                        Dashboard
                                    </MenuItem>
                                    <MenuItem onClick={() => handleNavigation('/tournaments')}>
                                        Tournaments
                                    </MenuItem>
                                    <MenuItem onClick={() => handleNavigation('/auctions')}>
                                        Auctions
                                    </MenuItem>
                                    <MenuItem onClick={() => handleNavigation('/players')}>
                                        Players
                                    </MenuItem>

                                    {user.role === 'team_owner' && (
                                        <MenuItem onClick={() => handleNavigation('/teams/my-team')}>
                                            My Team
                                        </MenuItem>
                                    )}

                                    {user.role === 'admin' && (
                                        <MenuItem onClick={() => handleNavigation('/admin')}>
                                            Admin
                                        </MenuItem>
                                    )}

                                    <Divider />

                                    <MenuItem onClick={() => handleNavigation('/profile')}>
                                        My Profile
                                    </MenuItem>
                                </Menu>
                                <UserProfile />
                            </>
                        ) : (
                            <>
                                <Button
                                    color="inherit"
                                    component={RouterLink}
                                    to="/login"
                                >
                                    Login
                                </Button>
                                <Button
                                    color="inherit"
                                    component={RouterLink}
                                    to="/register"
                                >
                                    Register
                                </Button>
                            </>
                        )}
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
};

export default Navbar;