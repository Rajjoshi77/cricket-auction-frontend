CREATE TABLE IF NOT EXISTS auction_bids (
    id INT PRIMARY KEY AUTO_INCREMENT,
    auction_id INT NOT NULL,
    player_id INT NOT NULL,
    team_id INT NOT NULL,
    bid_amount DECIMAL(10, 2) NOT NULL,
    bid_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_winning_bid BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (auction_id) REFERENCES auctions(id),
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (team_id) REFERENCES teams(id)
); 