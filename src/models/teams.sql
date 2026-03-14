-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    owner_id INT NOT NULL,
    logo_url VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    home_ground VARCHAR(100),
    total_budget DECIMAL(10, 2) DEFAULT 10000.00,
    remaining_budget DECIMAL(10, 2) DEFAULT 10000.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Team Players table (for tracking which players belong to which team)
CREATE TABLE IF NOT EXISTS team_players (
    id INT PRIMARY KEY AUTO_INCREMENT,
    team_id INT NOT NULL,
    player_id INT NOT NULL,
    purchase_price DECIMAL(10, 2),
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (player_id) REFERENCES players(id),
    UNIQUE KEY unique_team_player (team_id, player_id)
);

-- Team Auction Registration table
CREATE TABLE IF NOT EXISTS team_auction_registrations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    team_id INT NOT NULL,
    auction_id INT NOT NULL,
    purse_amount DECIMAL(10, 2) NOT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (auction_id) REFERENCES auctions(id),
    UNIQUE KEY unique_team_auction (team_id, auction_id)
);

-- Insert some dummy data
INSERT INTO teams (name, owner_id, city, state, home_ground, total_budget, remaining_budget)
VALUES 
('Mumbai Indians', 1, 'Mumbai', 'Maharashtra', 'Wankhede Stadium', 10000.00, 10000.00),
('Chennai Super Kings', 2, 'Chennai', 'Tamil Nadu', 'M.A. Chidambaram Stadium', 10000.00, 10000.00),
('Royal Challengers Bangalore', 3, 'Bangalore', 'Karnataka', 'M. Chinnaswamy Stadium', 10000.00, 10000.00); 