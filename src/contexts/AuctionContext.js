import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import axios from 'axios';

// Define base URL with environment variable fallback
const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;

const AuctionContext = createContext();

export const useAuction = () => {
    return useContext(AuctionContext);
};

export const AuctionProvider = ({ children }) => {
    const [auctions, setAuctions] = useState([]);
    const [currentAuction, setCurrentAuction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const { user, token } = useAuth();
    const navigate = useNavigate();

    // Reset states
    const resetStates = useCallback(() => {
        setError(null);
        setSuccess(null);
    }, []);

    // Get all auctions
    const fetchAuctions = useCallback(async () => {
        resetStates();
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/auctions`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setAuctions(response.data);
            setLoading(false);
            return response.data;
        } catch (err) {
            console.error('Error fetching auctions:', err);
            setError(err.response?.data?.message || 'Error fetching auctions');
            setLoading(false);
            return [];
        }
    }, [token, resetStates]);

    // Get auction by ID
    const fetchAuctionById = useCallback(async (auctionId) => {
        resetStates();
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/auctions/${auctionId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setCurrentAuction(response.data);
            setLoading(false);
            return response.data;
        } catch (err) {
            console.error(`Error fetching auction with ID ${auctionId}:`, err);
            setError(err.response?.data?.message || 'Error fetching auction details');
            setLoading(false);
            return null;
        }
    }, [token, resetStates]);

    // Create new auction
    const createAuction = useCallback(async (auctionData) => {
        resetStates();
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/auctions`, auctionData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setSuccess('Auction created successfully');
            setLoading(false);
            return response.data;
        } catch (err) {
            console.error('Error creating auction:', err);
            setError(err.response?.data?.message || 'Error creating auction');
            setLoading(false);
            throw err;
        }
    }, [token, resetStates]);

    // Update auction
    const updateAuction = useCallback(async (auctionId, auctionData) => {
        resetStates();
        setLoading(true);
        try {
            const response = await axios.put(`${API_URL}/auctions/${auctionId}`, auctionData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setSuccess('Auction updated successfully');
            setLoading(false);
            return response.data;
        } catch (err) {
            console.error(`Error updating auction with ID ${auctionId}:`, err);
            setError(err.response?.data?.message || 'Error updating auction');
            setLoading(false);
            throw err;
        }
    }, [token, resetStates]);

    // Add player to auction
    const addPlayerToAuction = useCallback(async (auctionId, playerData) => {
        resetStates();
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/auctions/${auctionId}/players`, playerData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setSuccess('Player added to auction successfully');
            setLoading(false);
            return response.data;
        } catch (err) {
            console.error(`Error adding player to auction with ID ${auctionId}:`, err);
            setError(err.response?.data?.message || 'Error adding player to auction');
            setLoading(false);
            throw err;
        }
    }, [token, resetStates]);

    // Register team for auction
    const registerTeamForAuction = useCallback(async (auctionId) => {
        resetStates();
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/auctions/${auctionId}/register`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setSuccess('Team registered for auction successfully');
            setLoading(false);
            return response.data;
        } catch (err) {
            console.error(`Error registering team for auction with ID ${auctionId}:`, err);
            setError(err.response?.data?.message || 'Error registering team for auction');
            setLoading(false);
            throw err;
        }
    }, [token, resetStates]);

    // Check registration status
    const checkRegistrationStatus = useCallback(async (auctionId) => {
        resetStates();
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/auctions/${auctionId}/registration-status`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setLoading(false);
            return response.data;
        } catch (err) {
            console.error(`Error checking registration status for auction with ID ${auctionId}:`, err);
            setError(err.response?.data?.message || 'Error checking registration status');
            setLoading(false);
            return { isRegistered: false };
        }
    }, [token, resetStates]);

    // Start auction
    const startAuction = useCallback(async (auctionId) => {
        resetStates();
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/auctions/${auctionId}/start`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setSuccess('Auction started successfully');
            setLoading(false);
            return response.data;
        } catch (err) {
            console.error(`Error starting auction with ID ${auctionId}:`, err);
            setError(err.response?.data?.message || 'Error starting auction');
            setLoading(false);
            throw err;
        }
    }, [token, resetStates]);

    // End auction
    const endAuction = useCallback(async (auctionId) => {
        resetStates();
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/auctions/${auctionId}/end`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setSuccess('Auction ended successfully');
            setLoading(false);
            return response.data;
        } catch (err) {
            console.error(`Error ending auction with ID ${auctionId}:`, err);
            setError(err.response?.data?.message || 'Error ending auction');
            setLoading(false);
            throw err;
        }
    }, [token, resetStates]);

    // Place bid
    const placeBid = useCallback(async (auctionId, bidData) => {
        resetStates();
        try {
            const response = await axios.post(`${API_URL}/auctions/${auctionId}/bid`, bidData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (err) {
            console.error(`Error placing bid for auction with ID ${auctionId}:`, err);
            setError(err.response?.data?.message || 'Error placing bid');
            throw err;
        }
    }, [token, resetStates]);

    // Use effect to clear success message after a delay
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => {
                setSuccess(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    const value = {
        auctions,
        currentAuction,
        loading,
        error,
        success,
        fetchAuctions,
        fetchAuctionById,
        createAuction,
        updateAuction,
        addPlayerToAuction,
        registerTeamForAuction,
        checkRegistrationStatus,
        startAuction,
        endAuction,
        placeBid,
        resetStates
    };

    return (
        <AuctionContext.Provider value={value}>
            {children}
        </AuctionContext.Provider>
    );
};

export default AuctionContext;