-- Create player categories table
CREATE TABLE IF NOT EXISTS player_categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(50) NOT NULL,
    base_price DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create players table
CREATE TABLE IF NOT EXISTS players (
    player_id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE NOT NULL,
    nationality VARCHAR(50) NOT NULL,
    specialization VARCHAR(50) NOT NULL,
    category_id INT,
    current_team_id INT DEFAULT NULL,
    base_price DECIMAL(12, 2) NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES player_categories(category_id),
    FOREIGN KEY (current_team_id) REFERENCES teams(team_id) ON DELETE SET NULL
);

-- Create player statistics table
CREATE TABLE IF NOT EXISTS player_statistics (
    player_id INT PRIMARY KEY,
    matches_played INT DEFAULT 0,
    runs_scored INT DEFAULT 0,
    wickets_taken INT DEFAULT 0,
    batting_average DECIMAL(6, 2) DEFAULT 0,
    bowling_average DECIMAL(6, 2) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(player_id) ON DELETE CASCADE
); 