const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const db = require('../config/db.config');

let io;
const activeAuctions = new Map(); // Map of auction_id to auction data

// Initialize socket server
const initializeSocket = (server) => {
    io = socketIo(server, {
        cors: {
            origin: ['http://localhost:3000'],
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication error: Token not provided'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
            socket.user = decoded;
            next();
        } catch (error) {
            console.error('Socket authentication error:', error);
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}, user_id: ${socket.user?.id}`);

        // Join auction room
        socket.on('joinAuction', async (data) => {
            try {
                const { auctionId } = data;

                // Validate auction exists and is active
                const [auctions] = await db.query(
                    'SELECT * FROM auctions WHERE id = ? AND status = "active"',
                    [auctionId]
                );

                if (auctions.length === 0) {
                    socket.emit('error', { message: 'Auction not found or not active' });
                    return;
                }

                const auction = auctions[0];

                // Join the auction room
                socket.join(`auction:${auctionId}`);

                // Get or initialize auction data
                let auctionData = activeAuctions.get(parseInt(auctionId));

                if (!auctionData) {
                    // Initialize auction data if it doesn't exist
                    auctionData = await initializeAuctionData(auctionId);
                    activeAuctions.set(parseInt(auctionId), auctionData);

                    // Start the auction if it's the first user
                    startNextPlayerBidding(auctionId);
                }

                // Send current auction state to the user
                socket.emit('auctionUpdate', auctionData);

                console.log(`User ${socket.user.id} joined auction ${auctionId}`);
            } catch (error) {
                console.error('Error joining auction:', error);
                socket.emit('error', { message: 'Failed to join auction' });
            }
        });

        // Place bid
        socket.on('placeBid', async (data) => {
            try {
                const { auctionId, playerId, amount } = data;
                const userId = socket.user.id;

                // Validate user is a team owner
                if (socket.user.role !== 'team_owner') {
                    socket.emit('error', { message: 'Only team owners can place bids' });
                    return;
                }

                // Get auction data
                const auctionData = activeAuctions.get(parseInt(auctionId));

                if (!auctionData) {
                    socket.emit('error', { message: 'Auction not found or not active' });
                    return;
                }

                // Validate current player
                if (!auctionData.currentPlayer || auctionData.currentPlayer.id !== playerId) {
                    socket.emit('error', { message: 'Invalid player ID or not the current player' });
                    return;
                }

                // Validate bid amount
                if (amount <= auctionData.currentBid) {
                    socket.emit('error', { message: 'Bid amount must be higher than current bid' });
                    return;
                }

                // Validate team has enough budget
                const [teams] = await db.query(
                    `SELECT t.*, tb.remaining_budget 
                     FROM teams t 
                     JOIN team_budget tb ON t.id = tb.team_id 
                     WHERE t.owner_id = ? AND tb.tournament_id = ?`,
                    [userId, auctionData.tournamentId]
                );

                if (teams.length === 0) {
                    socket.emit('error', { message: 'Team not found or not registered for this tournament' });
                    return;
                }

                const team = teams[0];

                if (team.remaining_budget < amount) {
                    socket.emit('error', { message: 'Insufficient budget to place this bid' });
                    return;
                }

                // Check if team is already highest bidder
                if (auctionData.bidLeader && auctionData.bidLeader.id === team.id) {
                    socket.emit('error', { message: 'You are already the highest bidder' });
                    return;
                }

                // Update bid data
                auctionData.currentBid = amount;
                auctionData.bidLeader = {
                    id: team.id,
                    team_name: team.team_name,
                    owner_id: userId,
                    username: socket.user.username
                };

                // Reset timer to add some time (give others a chance to bid)
                const newTimeLeft = Math.min(auctionData.timeLeft + 10, auction.time_per_player);
                auctionData.timeLeft = newTimeLeft;

                // Add to bid history
                const bidData = {
                    amount,
                    bidder: auctionData.bidLeader,
                    timestamp: new Date(),
                    timeLeft: newTimeLeft
                };

                auctionData.bidHistory.unshift(bidData);

                // Record the bid in the database
                await db.query(
                    `INSERT INTO auction_bids (auction_id, player_id, team_id, bid_amount, bid_time) 
                     VALUES (?, ?, ?, ?, NOW())`,
                    [auctionId, playerId, team.id, amount]
                );

                // Update auction data
                activeAuctions.set(parseInt(auctionId), auctionData);

                // Notify all users in the auction room
                io.to(`auction:${auctionId}`).emit('bidPlaced', bidData);
                io.to(`auction:${auctionId}`).emit('auctionUpdate', auctionData);

                console.log(`User ${userId} placed bid of ${amount} for player ${playerId} in auction ${auctionId}`);
            } catch (error) {
                console.error('Error placing bid:', error);
                socket.emit('error', { message: 'Failed to place bid' });
            }
        });

        // Disconnect
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });

    // Helper function to initialize auction data
    const initializeAuctionData = async (auctionId) => {
        try {
            // Get auction details
            const [auctions] = await db.query(
                'SELECT a.*, t.id as tournament_id, t.tournament_name FROM auctions a JOIN tournaments t ON a.tournament_id = t.id WHERE a.id = ?',
                [auctionId]
            );

            if (auctions.length === 0) {
                throw new Error('Auction not found');
            }

            const auction = auctions[0];

            // Get players for this auction who haven't been sold yet
            const [players] = await db.query(
                `SELECT p.*, ap.base_price, ap.status 
                 FROM auction_players ap 
                 JOIN players p ON ap.player_id = p.id 
                 WHERE ap.auction_id = ? AND ap.status = 'pending' 
                 ORDER BY ap.display_order, p.first_name`,
                [auctionId]
            );

            // Get sold players
            const [soldPlayers] = await db.query(
                `SELECT p.*, ap.sold_amount, ap.sold_to_team_id, t.team_name, u.id as owner_id, u.username 
                 FROM auction_players ap 
                 JOIN players p ON ap.player_id = p.id 
                 JOIN teams t ON ap.sold_to_team_id = t.id 
                 JOIN users u ON t.owner_id = u.id 
                 WHERE ap.auction_id = ? AND ap.status = 'sold' 
                 ORDER BY ap.updated_at DESC`,
                [auctionId]
            );

            const formattedSoldPlayers = soldPlayers.map(player => ({
                player: {
                    id: player.id,
                    first_name: player.first_name,
                    last_name: player.last_name,
                    playing_role: player.playing_role,
                    country: player.country
                },
                amount: player.sold_amount,
                buyer: {
                    id: player.sold_to_team_id,
                    team_name: player.team_name,
                    owner_id: player.owner_id,
                    username: player.username
                }
            }));

            // Initialize auction data
            const auctionData = {
                id: auction.id,
                name: auction.auction_name,
                tournamentId: auction.tournament_id,
                tournamentName: auction.tournament_name,
                currentPlayer: players.length > 0 ? players[0] : null,
                currentBid: players.length > 0 ? players[0].base_price : 0,
                bidLeader: null,
                timeLeft: auction.time_per_player || 60,
                bidHistory: [],
                upcomingPlayers: players.slice(1),
                soldPlayers: formattedSoldPlayers,
                bidIncrement: auction.bid_increment || 10000,
                status: 'active'
            };

            return auctionData;
        } catch (error) {
            console.error('Error initializing auction data:', error);
            throw error;
        }
    };

    // Helper function to start bidding for the next player
    const startNextPlayerBidding = async (auctionId) => {
        try {
            const auctionData = activeAuctions.get(parseInt(auctionId));

            if (!auctionData) {
                console.error(`Auction ${auctionId} not found`);
                return;
            }

            if (!auctionData.currentPlayer) {
                // No more players to auction, close the auction
                await endAuction(auctionId);
                return;
            }

            // Start timer for current player
            const timerInterval = setInterval(async () => {
                const updatedAuctionData = activeAuctions.get(parseInt(auctionId));

                if (!updatedAuctionData || updatedAuctionData.status !== 'active') {
                    clearInterval(timerInterval);
                    return;
                }

                updatedAuctionData.timeLeft -= 1;

                // Update auction data
                activeAuctions.set(parseInt(auctionId), updatedAuctionData);

                // Emit timer update
                io.to(`auction:${auctionId}`).emit('timerUpdate', {
                    timeLeft: updatedAuctionData.timeLeft
                });

                // Check if time is up
                if (updatedAuctionData.timeLeft <= 0) {
                    clearInterval(timerInterval);

                    // Handle end of bidding for current player
                    await handlePlayerBidEnd(auctionId);
                }
            }, 1000);
        } catch (error) {
            console.error('Error starting next player bidding:', error);
        }
    };

    // Helper function to handle end of bidding for a player
    const handlePlayerBidEnd = async (auctionId) => {
        try {
            const auctionData = activeAuctions.get(parseInt(auctionId));

            if (!auctionData || !auctionData.currentPlayer) {
                return;
            }

            const currentPlayer = auctionData.currentPlayer;

            // Check if there's a winning bid
            if (auctionData.bidLeader) {
                // Player sold
                const bidLeader = auctionData.bidLeader;
                const soldAmount = auctionData.currentBid;

                // Update database
                await db.query(
                    'UPDATE auction_players SET status = "sold", sold_amount = ?, sold_to_team_id = ?, updated_at = NOW() WHERE auction_id = ? AND player_id = ?',
                    [soldAmount, bidLeader.id, auctionId, currentPlayer.id]
                );

                // Update team budget
                await db.query(
                    'UPDATE team_budget SET remaining_budget = remaining_budget - ? WHERE team_id = ? AND tournament_id = ?',
                    [soldAmount, bidLeader.id, auctionData.tournamentId]
                );

                // Assign player to team
                await db.query(
                    'INSERT INTO team_players (team_id, player_id, acquisition_type, acquisition_price) VALUES (?, ?, "auction", ?)',
                    [bidLeader.id, currentPlayer.id, soldAmount]
                );

                // Update player's current team
                await db.query(
                    'UPDATE players SET current_team_id = ? WHERE id = ?',
                    [bidLeader.id, currentPlayer.id]
                );

                // Add to sold players list
                const soldPlayerData = {
                    player: {
                        id: currentPlayer.id,
                        first_name: currentPlayer.first_name,
                        last_name: currentPlayer.last_name,
                        playing_role: currentPlayer.playing_role,
                        country: currentPlayer.country
                    },
                    amount: soldAmount,
                    buyer: bidLeader
                };

                auctionData.soldPlayers.unshift(soldPlayerData);

                // Notify all users in the auction room
                io.to(`auction:${auctionId}`).emit('playerSold', soldPlayerData);
            } else {
                // Player unsold
                await db.query(
                    'UPDATE auction_players SET status = "unsold", updated_at = NOW() WHERE auction_id = ? AND player_id = ?',
                    [auctionId, currentPlayer.id]
                );

                // Notify all users in the auction room
                io.to(`auction:${auctionId}`).emit('playerUnsold', {
                    player: currentPlayer
                });
            }

            // Move to the next player
            auctionData.currentPlayer = auctionData.upcomingPlayers.length > 0 ?
                auctionData.upcomingPlayers.shift() : null;

            // Reset auction data for next player
            auctionData.currentBid = auctionData.currentPlayer ? auctionData.currentPlayer.base_price : 0;
            auctionData.bidLeader = null;
            auctionData.timeLeft = auctionData.auction?.time_per_player || 60;
            auctionData.bidHistory = [];

            // Update auction data
            activeAuctions.set(parseInt(auctionId), auctionData);

            // Send updated auction data to all users
            io.to(`auction:${auctionId}`).emit('auctionUpdate', auctionData);

            // Start bidding for next player
            if (auctionData.currentPlayer) {
                startNextPlayerBidding(auctionId);
            } else {
                // No more players, end the auction
                await endAuction(auctionId);
            }
        } catch (error) {
            console.error('Error handling player bid end:', error);
        }
    };

    // Helper function to end the auction
    const endAuction = async (auctionId) => {
        try {
            // Update auction status in database
            await db.query(
                'UPDATE auctions SET status = "completed", end_time = NOW() WHERE id = ?',
                [auctionId]
            );

            // Update auction data
            const auctionData = activeAuctions.get(parseInt(auctionId));

            if (auctionData) {
                auctionData.status = 'completed';
                activeAuctions.set(parseInt(auctionId), auctionData);

                // Notify all users in the auction room
                io.to(`auction:${auctionId}`).emit('auctionEnded', {
                    message: 'Auction has ended'
                });

                // Remove from active auctions after a delay
                setTimeout(() => {
                    activeAuctions.delete(parseInt(auctionId));
                }, 60000); // 1 minute
            }
        } catch (error) {
            console.error('Error ending auction:', error);
        }
    };

    return io;
};

module.exports = { initializeSocket }; 