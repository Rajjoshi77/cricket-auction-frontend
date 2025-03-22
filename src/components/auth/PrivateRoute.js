import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';
import axios from 'axios';

// Add API URL constant
const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;

const PrivateRoute = ({ children, requiredRole }) => {
    const { user, setUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const verifyAuth = async () => {
            try {
                const token = localStorage.getItem('token');

                if (!token) {
                    setIsAuthenticated(false);
                    return;
                }

                // Verify token with backend
                const response = await axios.get(`${API_URL}/auth/verify`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.data.valid) {
                    setIsAuthenticated(true);
                    // Update user data if needed
                    if (!user) {
                        setUser(response.data.user);
                    }
                } else {
                    localStorage.removeItem('token');
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error('Auth verification failed:', error);
                localStorage.removeItem('token');
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };

        verifyAuth();
    }, [setUser, user]);

    if (loading) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="100vh"
            >
                <CircularProgress />
            </Box>
        );
    }

    if (!isAuthenticated) {
        // Save the attempted URL for redirecting after login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check for required role if specified
    if (requiredRole && user?.role !== requiredRole) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

export default PrivateRoute;