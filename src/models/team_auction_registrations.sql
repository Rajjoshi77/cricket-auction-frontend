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