CREATE TABLE IF NOT EXISTS auction_players (
    id INT PRIMARY KEY AUTO_INCREMENT,
    auction_id INT NOT NULL,
    player_id INT NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    final_price DECIMAL(10, 2),
    status ENUM('unsold', 'sold', 'pending', 'in_auction') DEFAULT 'pending',
    winning_team_id INT,
    auction_order INT,
    auction_start_time TIMESTAMP NULL,
    auction_end_time TIMESTAMP NULL,
    FOREIGN KEY (auction_id) REFERENCES auctions(id),
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (winning_team_id) REFERENCES teams(id),
    UNIQUE KEY unique_auction_player (auction_id, player_id)
); 