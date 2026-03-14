CREATE TABLE IF NOT EXISTS tournament_teams (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tournament_id INT NOT NULL,
    team_id INT NOT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    registration_fee DECIMAL(10, 2) DEFAULT 0.00,
    payment_status ENUM('pending', 'completed') DEFAULT 'pending',
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
    FOREIGN KEY (team_id) REFERENCES teams(id),
    UNIQUE KEY unique_tournament_team (tournament_id, team_id)
); 