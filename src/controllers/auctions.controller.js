const db = require('../config/db.config');

// Get all auctions
exports.getAllAuctions = async (req, res) => {
    try {
        const [auctions] = await db.query(`
            SELECT a.*, t.tournament_name,
            (SELECT COUNT(*) FROM team_auction_registrations WHERE auction_id = a.id) as registered_teams
            FROM auctions a
            JOIN tournaments t ON a.tournament_id = t.id
            ORDER BY a.start_time DESC
        `);

        // For each auction, check if the user's team is registered
        if (req.user.role === 'team_owner') {
            const [teams] = await db.query(
                'SELECT id FROM teams WHERE owner_id = ?',
                [req.user.id]
            );

            if (teams.length > 0) {
                const teamId = teams[0].id;

                for (let auction of auctions) {
                    const [registration] = await db.query(
                        'SELECT * FROM team_auction_registrations WHERE auction_id = ? AND team_id = ?',
                        [auction.id, teamId]
                    );

                    auction.isRegistered = registration.length > 0;
                }
            }
        }

        res.json(auctions);
    } catch (error) {
        console.error('Error fetching auctions:', error);
        res.status(500).json({ message: 'Error fetching auctions', error: error.message });
    }
};

// Get auction by ID
exports.getAuctionById = async (req, res) => {
    try {
        const id = req.params.id;

        const [auctions] = await db.query(`
            SELECT a.*, t.tournament_name,
            (SELECT COUNT(*) FROM team_auction_registrations WHERE auction_id = a.id) as registered_teams
            FROM auctions a
            JOIN tournaments t ON a.tournament_id = t.id
            WHERE a.id = ?
        `, [id]);

        if (auctions.length === 0) {
            return res.status(404).json({ message: 'Auction not found' });
        }

        const auction = auctions[0];

        // Get auction players
        const [players] = await db.query(`
            SELECT p.*, ap.base_price, ap.status
            FROM auction_players ap
            JOIN players p ON ap.player_id = p.id
            WHERE ap.auction_id = ?
            ORDER BY ap.display_order, p.first_name
        `, [id]);

        auction.players = players;

        // Check if user's team is registered (if team owner)
        if (req.user.role === 'team_owner') {
            const [teams] = await db.query(
                'SELECT id FROM teams WHERE owner_id = ?',
                [req.user.id]
            );

            if (teams.length > 0) {
                const teamId = teams[0].id;

                const [registration] = await db.query(
                    'SELECT * FROM team_auction_registrations WHERE auction_id = ? AND team_id = ?',
                    [id, teamId]
                );

                auction.isRegistered = registration.length > 0;
            }
        }

        res.json(auction);
    } catch (error) {
        console.error('Error fetching auction details:', error);
        res.status(500).json({ message: 'Error fetching auction details', error: error.message });
    }
};

// Create new auction
exports.createAuction = async (req, res) => {
    try {
        const {
            tournament_id,
            auction_name,
            start_time,
            end_time,
            status,
            bid_increment,
            min_bid_amount,
            time_per_player,
            description
        } = req.body;

        // Validate required fields
        if (!tournament_id || !auction_name || !start_time) {
            return res.status(400).json({
                message: 'Missing required fields',
                required: ['tournament_id', 'auction_name', 'start_time']
            });
        }

        // Validate that user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can create auctions' });
        }

        // Insert auction
        const [result] = await db.query(
            `INSERT INTO auctions (
                tournament_id, auction_name, start_time, end_time, status,
                bid_increment, min_bid_amount, time_per_player, description
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                tournament_id,
                auction_name,
                start_time,
                end_time || null,
                status || 'upcoming',
                bid_increment || 10000,
                min_bid_amount || 20000,
                time_per_player || 60,
                description || null
            ]
        );

        res.status(201).json({
            message: 'Auction created successfully',
            auction_id: result.insertId
        });
    } catch (error) {
        console.error('Error creating auction:', error);
        res.status(500).json({ message: 'Error creating auction', error: error.message });
    }
};

// Add player to auction
exports.addPlayerToAuction = async (req, res) => {
    try {
        const auctionId = req.params.id;
        const { player_id, base_price } = req.body;

        // Validate required fields
        if (!player_id) {
            return res.status(400).json({
                message: 'Missing required fields',
                required: ['player_id']
            });
        }

        // Validate that user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can add players to auctions' });
        }

        // Check if auction exists
        const [auctions] = await db.query(
            'SELECT * FROM auctions WHERE id = ?',
            [auctionId]
        );

        if (auctions.length === 0) {
            return res.status(404).json({ message: 'Auction not found' });
        }

        // Check if player exists
        const [players] = await db.query(
            'SELECT * FROM players WHERE id = ?',
            [player_id]
        );

        if (players.length === 0) {
            return res.status(404).json({ message: 'Player not found' });
        }

        // Check if player is already in auction
        const [existingPlayers] = await db.query(
            'SELECT * FROM auction_players WHERE auction_id = ? AND player_id = ?',
            [auctionId, player_id]
        );

        if (existingPlayers.length > 0) {
            return res.status(400).json({ message: 'Player already added to this auction' });
        }

        // Get next display order
        const [lastOrder] = await db.query(
            'SELECT MAX(display_order) as max_order FROM auction_players WHERE auction_id = ?',
            [auctionId]
        );

        const displayOrder = lastOrder[0].max_order ? lastOrder[0].max_order + 1 : 1;

        // Add player to auction
        await db.query(
            `INSERT INTO auction_players (
                auction_id, player_id, base_price, status, display_order
            ) VALUES (?, ?, ?, ?, ?)`,
            [
                auctionId,
                player_id,
                base_price || auctions[0].min_bid_amount || 20000,
                'pending',
                displayOrder
            ]
        );

        res.status(201).json({ message: 'Player added to auction successfully' });
    } catch (error) {
        console.error('Error adding player to auction:', error);
        res.status(500).json({ message: 'Error adding player to auction', error: error.message });
    }
};

// Update auction
exports.updateAuction = async (req, res) => {
    try {
        const id = req.params.id;
        const {
            auction_name,
            start_time,
            end_time,
            status,
            bid_increment,
            min_bid_amount,
            time_per_player,
            description
        } = req.body;

        // Validate that user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can update auctions' });
        }

        // Check if auction exists
        const [auctions] = await db.query(
            'SELECT * FROM auctions WHERE id = ?',
            [id]
        );

        if (auctions.length === 0) {
            return res.status(404).json({ message: 'Auction not found' });
        }

        // Update auction
        await db.query(
            `UPDATE auctions SET
                auction_name = ?,
                start_time = ?,
                end_time = ?,
                status = ?,
                bid_increment = ?,
                min_bid_amount = ?,
                time_per_player = ?,
                description = ?
            WHERE id = ?`,
            [
                auction_name || auctions[0].auction_name,
                start_time || auctions[0].start_time,
                end_time || auctions[0].end_time,
                status || auctions[0].status,
                bid_increment || auctions[0].bid_increment,
                min_bid_amount || auctions[0].min_bid_amount,
                time_per_player || auctions[0].time_per_player,
                description !== undefined ? description : auctions[0].description,
                id
            ]
        );

        res.json({ message: 'Auction updated successfully' });
    } catch (error) {
        console.error('Error updating auction:', error);
        res.status(500).json({ message: 'Error updating auction', error: error.message });
    }
};

// Register team for auction
exports.registerTeamForAuction = async (req, res) => {
    try {
        const auctionId = req.params.id;
        const userId = req.user.id;

        // Validate that user is team owner
        if (req.user.role !== 'team_owner') {
            return res.status(403).json({ message: 'Only team owners can register for auctions' });
        }

        // Check if auction exists and is upcoming
        const [auctions] = await db.query(
            'SELECT a.*, t.id as tournament_id FROM auctions a JOIN tournaments t ON a.tournament_id = t.id WHERE a.id = ? AND a.status = "upcoming"',
            [auctionId]
        );

        if (auctions.length === 0) {
            return res.status(404).json({ message: 'Auction not found or not in upcoming status' });
        }

        const auction = auctions[0];

        // Get user's team
        const [teams] = await db.query(
            'SELECT * FROM teams WHERE owner_id = ?',
            [userId]
        );

        if (teams.length === 0) {
            return res.status(404).json({ message: 'You do not own a team' });
        }

        const team = teams[0];

        // Check if team is already registered for this auction
        const [registrations] = await db.query(
            'SELECT * FROM team_auction_registrations WHERE auction_id = ? AND team_id = ?',
            [auctionId, team.id]
        );

        if (registrations.length > 0) {
            return res.status(400).json({ message: 'Team already registered for this auction' });
        }

        // Check if team is registered for the tournament and has budget
        const [budgets] = await db.query(
            'SELECT * FROM team_budget WHERE team_id = ? AND tournament_id = ?',
            [team.id, auction.tournament_id]
        );

        if (budgets.length === 0) {
            return res.status(400).json({ message: 'Team not registered for this tournament' });
        }

        const budget = budgets[0];

        // Register team for auction
        await db.query(
            'INSERT INTO team_auction_registrations (auction_id, team_id, registration_time) VALUES (?, ?, NOW())',
            [auctionId, team.id]
        );

        res.status(201).json({
            message: 'Team registered for auction successfully',
            team: {
                id: team.id,
                name: team.team_name,
                total_budget: budget.total_budget,
                remaining_budget: budget.remaining_budget
            }
        });
    } catch (error) {
        console.error('Error registering team for auction:', error);
        res.status(500).json({ message: 'Error registering team for auction', error: error.message });
    }
};

// Check if team is registered for auction
exports.checkRegistrationStatus = async (req, res) => {
    try {
        const auctionId = req.params.id;
        const userId = req.user.id;

        // Validate that user is team owner
        if (req.user.role !== 'team_owner') {
            return res.status(403).json({ message: 'Only team owners can check registration status' });
        }

        // Get user's team
        const [teams] = await db.query(
            'SELECT * FROM teams WHERE owner_id = ?',
            [userId]
        );

        if (teams.length === 0) {
            return res.json({ isRegistered: false, message: 'You do not own a team' });
        }

        const team = teams[0];

        // Check if team is registered for this auction
        const [registrations] = await db.query(
            'SELECT * FROM team_auction_registrations WHERE auction_id = ? AND team_id = ?',
            [auctionId, team.id]
        );

        res.json({
            isRegistered: registrations.length > 0,
            teamId: team.id
        });
    } catch (error) {
        console.error('Error checking registration status:', error);
        res.status(500).json({ message: 'Error checking registration status', error: error.message });
    }
};

// Start auction (admin only)
exports.startAuction = async (req, res) => {
    try {
        const id = req.params.id;

        // Validate that user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can start auctions' });
        }

        // Check if auction exists and is upcoming
        const [auctions] = await db.query(
            'SELECT * FROM auctions WHERE id = ? AND status = "upcoming"',
            [id]
        );

        if (auctions.length === 0) {
            return res.status(404).json({ message: 'Auction not found or not in upcoming status' });
        }

        // Check if there are players in the auction
        const [players] = await db.query(
            'SELECT COUNT(*) as count FROM auction_players WHERE auction_id = ?',
            [id]
        );

        if (players[0].count === 0) {
            return res.status(400).json({ message: 'Cannot start auction with no players' });
        }

        // Check if there are registered teams
        const [teams] = await db.query(
            'SELECT COUNT(*) as count FROM team_auction_registrations WHERE auction_id = ?',
            [id]
        );

        if (teams[0].count === 0) {
            return res.status(400).json({ message: 'Cannot start auction with no registered teams' });
        }

        // Start transaction
        await db.query('START TRANSACTION');

        // Update auction status
        await db.query(
            'UPDATE auctions SET status = "active", start_time = NOW() WHERE id = ?',
            [id]
        );

        // Set first player to active
        await db.query(
            `UPDATE auction_players SET status = 'active' 
             WHERE auction_id = ? AND id = (
                 SELECT id FROM (
                     SELECT id FROM auction_players 
                     WHERE auction_id = ? AND status = 'pending' 
                     ORDER BY display_order, id LIMIT 1
                 ) as subquery
             )`,
            [id, id]
        );

        // Commit transaction
        await db.query('COMMIT');

        res.json({ message: 'Auction started successfully' });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Error starting auction:', error);
        res.status(500).json({ message: 'Error starting auction', error: error.message });
    }
};

// End auction (admin only)
exports.endAuction = async (req, res) => {
    try {
        const id = req.params.id;

        // Validate that user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can end auctions' });
        }

        // Check if auction exists and is active
        const [auctions] = await db.query(
            'SELECT * FROM auctions WHERE id = ? AND status = "active"',
            [id]
        );

        if (auctions.length === 0) {
            return res.status(404).json({ message: 'Auction not found or not in active status' });
        }

        // Update auction status
        await db.query(
            'UPDATE auctions SET status = "completed", end_time = NOW() WHERE id = ?',
            [id]
        );

        // Mark all pending players as unsold
        await db.query(
            'UPDATE auction_players SET status = "unsold" WHERE auction_id = ? AND status IN ("pending", "active")',
            [id]
        );

        res.json({ message: 'Auction ended successfully' });
    } catch (error) {
        console.error('Error ending auction:', error);
        res.status(500).json({ message: 'Error ending auction', error: error.message });
    }
};

// Update auction status (admin only)
exports.updateAuctionStatus = async (req, res) => {
    try {
        const id = req.params.id;
        const { status } = req.body;

        // Validate that user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can update auction status' });
        }

        // Check if auction exists
        const [auctions] = await db.query(
            'SELECT * FROM auctions WHERE id = ?',
            [id]
        );

        if (auctions.length === 0) {
            return res.status(404).json({ message: 'Auction not found' });
        }

        // Validate status transition
        const currentStatus = auctions[0].status;
        const validTransitions = {
            'upcoming': ['active', 'cancelled'],
            'active': ['completed', 'cancelled'],
            'completed': [],
            'cancelled': []
        };

        if (!validTransitions[currentStatus].includes(status)) {
            return res.status(400).json({
                message: `Cannot transition from ${currentStatus} to ${status}`,
                validTransitions: validTransitions[currentStatus]
            });
        }

        // Update auction status
        await db.query(
            'UPDATE auctions SET status = ?, updated_at = NOW() WHERE id = ?',
            [status, id]
        );

        // Additional actions based on status change
        if (status === 'active') {
            // Set start time
            await db.query(
                'UPDATE auctions SET start_time = NOW() WHERE id = ?',
                [id]
            );
        } else if (status === 'completed') {
            // Set end time
            await db.query(
                'UPDATE auctions SET end_time = NOW() WHERE id = ?',
                [id]
            );

            // Mark all pending players as unsold
            await db.query(
                'UPDATE auction_players SET status = "unsold" WHERE auction_id = ? AND status IN ("pending", "active")',
                [id]
            );
        }

        res.json({
            message: 'Auction status updated successfully',
            auction: {
                id,
                status
            }
        });
    } catch (error) {
        console.error('Error updating auction status:', error);
        res.status(500).json({ message: 'Error updating auction status', error: error.message });
    }
};

// Get my team details for auction (team owner only)
exports.getMyTeamDetails = async (req, res) => {
    try {
        const auctionId = req.params.id;
        const userId = req.user.id;

        // Validate that user is team owner
        if (req.user.role !== 'team_owner') {
            return res.status(403).json({ message: 'Only team owners can view their team details' });
        }

        // Get user's team
        const [teams] = await db.query(
            'SELECT * FROM teams WHERE owner_id = ?',
            [userId]
        );

        if (teams.length === 0) {
            return res.status(404).json({ message: 'You do not own a team' });
        }

        const team = teams[0];

        // Check if team is registered for this auction
        const [registrations] = await db.query(
            'SELECT * FROM team_auction_registrations WHERE auction_id = ? AND team_id = ?',
            [auctionId, team.id]
        );

        if (registrations.length === 0) {
            return res.status(404).json({ message: 'Your team is not registered for this auction' });
        }

        // Get auction details
        const [auctions] = await db.query(
            'SELECT a.*, t.id as tournament_id FROM auctions a JOIN tournaments t ON a.tournament_id = t.id WHERE a.id = ?',
            [auctionId]
        );

        if (auctions.length === 0) {
            return res.status(404).json({ message: 'Auction not found' });
        }

        const auction = auctions[0];

        // Get team budget
        const [budgets] = await db.query(
            'SELECT * FROM team_budget WHERE team_id = ? AND tournament_id = ?',
            [team.id, auction.tournament_id]
        );

        if (budgets.length === 0) {
            return res.status(404).json({ message: 'Team budget not found for this tournament' });
        }

        const budget = budgets[0];

        // Get players bought by the team in this auction
        const [players] = await db.query(`
            SELECT ap.*, p.player_name, p.base_price, p.country, p.age, p.player_role, p.batting_style, p.bowling_style, p.image_url
            FROM auction_players ap
            JOIN players p ON ap.player_id = p.id
            WHERE ap.auction_id = ? AND ap.sold_to = ? AND ap.status = 'sold'
        `, [auctionId, team.id]);

        // Calculate total spent
        let totalSpent = 0;
        for (const player of players) {
            totalSpent += player.sold_amount;
        }

        res.json({
            team: {
                id: team.id,
                name: team.team_name,
                logo: team.logo_url
            },
            budget: {
                total: budget.total_budget,
                remaining: budget.remaining_budget,
                spent: totalSpent
            },
            players: players,
            auction: {
                id: auction.id,
                name: auction.name,
                status: auction.status
            }
        });
    } catch (error) {
        console.error('Error getting team details for auction:', error);
        res.status(500).json({ message: 'Error getting team details for auction', error: error.message });
    }
};

// Place bid in auction
exports.placeBid = async (req, res) => {
    try {
        const auctionId = req.params.id;
        const { player_id, team_id, amount } = req.body;
        const userId = req.user.id;

        // Start transaction
        await db.query('START TRANSACTION');

        // Validate that user is team owner
        if (req.user.role !== 'team_owner') {
            await db.query('ROLLBACK');
            return res.status(403).json({ message: 'Only team owners can place bids' });
        }

        // Get user's team
        const [teams] = await db.query(
            'SELECT * FROM teams WHERE owner_id = ?',
            [userId]
        );

        if (teams.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ message: 'You do not own a team' });
        }

        const team = teams[0];

        // Validate team_id matches user's team
        if (parseInt(team_id) !== team.id) {
            await db.query('ROLLBACK');
            return res.status(403).json({ message: 'You can only bid for your own team' });
        }

        // Check if team is registered for this auction
        const [registrations] = await db.query(
            'SELECT * FROM team_auction_registrations WHERE auction_id = ? AND team_id = ?',
            [auctionId, team.id]
        );

        if (registrations.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ message: 'Your team is not registered for this auction' });
        }

        // Check if auction is active
        const [auctions] = await db.query(
            'SELECT a.*, t.id as tournament_id FROM auctions a JOIN tournaments t ON a.tournament_id = t.id WHERE a.id = ? AND a.status = "active"',
            [auctionId]
        );

        if (auctions.length === 0) {
            await db.query('ROLLBACK');
            return res.status(400).json({ message: 'Auction is not active' });
        }

        const auction = auctions[0];

        // Check if player is currently up for bidding
        const [players] = await db.query(
            'SELECT * FROM auction_players WHERE auction_id = ? AND id = ? AND status = "active"',
            [auctionId, player_id]
        );

        if (players.length === 0) {
            await db.query('ROLLBACK');
            return res.status(400).json({ message: 'Player is not currently up for bidding' });
        }

        const player = players[0];

        // Get current highest bid
        const [highestBids] = await db.query(
            'SELECT * FROM bids WHERE auction_player_id = ? ORDER BY amount DESC LIMIT 1',
            [player_id]
        );

        const currentHighestBid = highestBids.length > 0 ? highestBids[0].amount : player.base_price;
        const minBidAmount = currentHighestBid * 1.05; // 5% increment

        // Check if bid amount is high enough
        if (amount < minBidAmount) {
            await db.query('ROLLBACK');
            return res.status(400).json({
                message: 'Bid amount is too low',
                currentHighestBid,
                minBidAmount
            });
        }

        // Check if team has enough budget
        const [budgets] = await db.query(
            'SELECT * FROM team_budget WHERE team_id = ? AND tournament_id = ?',
            [team.id, auction.tournament_id]
        );

        if (budgets.length === 0 || budgets[0].remaining_budget < amount) {
            await db.query('ROLLBACK');
            return res.status(400).json({
                message: 'Insufficient budget',
                remainingBudget: budgets.length > 0 ? budgets[0].remaining_budget : 0,
                bidAmount: amount
            });
        }

        // Record the bid
        await db.query(
            'INSERT INTO bids (auction_player_id, team_id, amount, bid_time) VALUES (?, ?, ?, NOW())',
            [player_id, team_id, amount]
        );

        // Update the current highest bid on the player
        await db.query(
            'UPDATE auction_players SET current_bid = ?, highest_bidder = ? WHERE id = ?',
            [amount, team_id, player_id]
        );

        // Commit transaction
        await db.query('COMMIT');

        res.status(201).json({
            message: 'Bid placed successfully',
            bid: {
                player_id,
                team_id,
                amount,
                timestamp: new Date()
            }
        });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Error placing bid:', error);
        res.status(500).json({ message: 'Error placing bid', error: error.message });
    }
};
