-- Auctions table
CREATE TABLE IF NOT EXISTS auctions (
    auction_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    tournament_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    min_purse DECIMAL(12, 2) NOT NULL,
    status ENUM('upcoming', 'active', 'completed') DEFAULT 'upcoming',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(tournament_id) ON DELETE CASCADE
);

-- Auction Players table (players available in auction)
CREATE TABLE IF NOT EXISTS auction_players (
    auction_id INT NOT NULL,
    player_id INT NOT NULL,
    base_price DECIMAL(12, 2) DEFAULT 1000000,
    status ENUM('available', 'sold', 'unsold') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (auction_id, player_id),
    FOREIGN KEY (auction_id) REFERENCES auctions(auction_id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(player_id) ON DELETE CASCADE
);

-- Auction Bids table
CREATE TABLE IF NOT EXISTS auction_bids (
    bid_id INT PRIMARY KEY AUTO_INCREMENT,
    auction_id INT NOT NULL,
    player_id INT NOT NULL,
    team_id INT NOT NULL,
    bid_amount DECIMAL(12, 2) NOT NULL,
    bid_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'won', 'lost') DEFAULT 'active',
    FOREIGN KEY (auction_id) REFERENCES auctions(auction_id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(player_id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE
); 