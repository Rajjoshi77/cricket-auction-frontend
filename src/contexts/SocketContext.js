import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { token, user } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState(null);

    useEffect(() => {
        if (!token || !user) {
            if (socket) {
                console.log('No token or user, disconnecting socket');
                socket.disconnect();
                setSocket(null);
                setIsConnected(false);
            }
            return;
        }

        console.log('Initializing socket connection...', { userRole: user.role });
        const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const newSocket = io(SOCKET_URL, {
            auth: {
                token,
                userId: user.id,
                userRole: user.role
            },
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            transports: ['websocket'],
            query: {
                userId: user.id,
                userRole: user.role
            }
        });

        newSocket.on('connect', () => {
            console.log('Socket connected successfully');
            setIsConnected(true);
            setConnectionError(null);
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            setIsConnected(false);
            setConnectionError(error.message);
        });

        newSocket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            setIsConnected(false);
            if (reason === 'io server disconnect') {
                // the disconnection was initiated by the server, reconnect manually
                newSocket.connect();
            }
        });

        newSocket.on('error', (error) => {
            console.error('Socket error:', error);
            setIsConnected(false);
            setConnectionError(error.message);
        });

        newSocket.on('unauthorized', (error) => {
            console.error('Socket unauthorized:', error);
            setIsConnected(false);
            setConnectionError('Unauthorized: ' + error.message);
        });

        setSocket(newSocket);

        return () => {
            if (newSocket) {
                console.log('Cleaning up socket connection');
                newSocket.disconnect();
                setIsConnected(false);
            }
        };
    }, [token, user]);

    const value = {
        socket,
        isConnected,
        connectionError
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};