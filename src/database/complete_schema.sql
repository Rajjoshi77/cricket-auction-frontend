-- Drop database if it exists and create new one
DROP DATABASE IF EXISTS cricket_auction_system;
CREATE DATABASE cricket_auction_system;
USE cricket_auction_system;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'team_owner') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    owner_id INT NOT NULL,
    logo_url VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    home_ground VARCHAR(100),
    total_budget DECIMAL(12, 2) DEFAULT 10000000.00,
    remaining_budget DECIMAL(12, 2) DEFAULT 10000000.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tournament_name VARCHAR(100) NOT NULL,
    season_year INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    registration_deadline DATE NOT NULL,
    max_teams INT NOT NULL DEFAULT 8,
    min_players_per_team INT NOT NULL DEFAULT 15,
    max_players_per_team INT NOT NULL DEFAULT 25,
    base_budget_per_team DECIMAL(12, 2) NOT NULL DEFAULT 10000000.00,
    venue VARCHAR(255),
    description TEXT,
    status ENUM('upcoming', 'ongoing', 'completed') DEFAULT 'upcoming',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tournament Teams table (for tournament registrations)
CREATE TABLE IF NOT EXISTS tournament_teams (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tournament_id INT NOT NULL,
    team_id INT NOT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    registration_fee DECIMAL(12, 2) NOT NULL,
    payment_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
    FOREIGN KEY (team_id) REFERENCES teams(id),
    UNIQUE KEY unique_tournament_team (tournament_id, team_id)
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    age INT NOT NULL,
    country VARCHAR(50) NOT NULL,
    role ENUM('batsman', 'bowler', 'all_rounder', 'wicket_keeper') NOT NULL,
    specialization ENUM('right_handed', 'left_handed', 'fast', 'spin') NOT NULL,
    base_price DECIMAL(12, 2) NOT NULL,
    status ENUM('available', 'unavailable', 'injured') DEFAULT 'available',
    profile_image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Player Statistics table
CREATE TABLE IF NOT EXISTS player_statistics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    player_id INT NOT NULL,
    matches_played INT DEFAULT 0,
    runs_scored INT DEFAULT 0,
    batting_average DECIMAL(6, 2) DEFAULT 0.00,
    strike_rate DECIMAL(6, 2) DEFAULT 0.00,
    highest_score INT DEFAULT 0,
    centuries INT DEFAULT 0,
    half_centuries INT DEFAULT 0,
    wickets_taken INT DEFAULT 0,
    bowling_average DECIMAL(6, 2) DEFAULT 0.00,
    economy_rate DECIMAL(6, 2) DEFAULT 0.00,
    best_bowling_figures VARCHAR(10),
    catches_taken INT DEFAULT 0,
    stumpings INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    UNIQUE KEY unique_player_stats (player_id)
);

-- Team Players table (for tracking team rosters)
CREATE TABLE IF NOT EXISTS team_players (
    id INT PRIMARY KEY AUTO_INCREMENT,
    team_id INT NOT NULL,
    player_id INT NOT NULL,
    season_year INT NOT NULL,
    purchase_price DECIMAL(12, 2),
    status ENUM('active', 'inactive', 'released') DEFAULT 'active',
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (player_id) REFERENCES players(id),
    UNIQUE KEY unique_team_player_season (team_id, player_id, season_year)
);

-- Auctions table
CREATE TABLE IF NOT EXISTS auctions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    tournament_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    min_purse DECIMAL(12, 2) NOT NULL,
    status ENUM('upcoming', 'active', 'completed') DEFAULT 'upcoming',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
);

-- Team Auction Registrations table
CREATE TABLE IF NOT EXISTS team_auction_registrations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    auction_id INT NOT NULL,
    team_id INT NOT NULL,
    purse_amount DECIMAL(12, 2) NOT NULL,
    remaining_amount DECIMAL(12, 2) NOT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (auction_id) REFERENCES auctions(id),
    FOREIGN KEY (team_id) REFERENCES teams(id),
    UNIQUE KEY unique_team_auction (team_id, auction_id)
);

-- Auction Players table
CREATE TABLE IF NOT EXISTS auction_players (
    id INT PRIMARY KEY AUTO_INCREMENT,
    auction_id INT NOT NULL,
    player_id INT NOT NULL,
    base_price DECIMAL(12, 2) NOT NULL,
    sold_price DECIMAL(12, 2),
    winning_team_id INT,
    status ENUM('pending', 'active', 'sold', 'unsold') DEFAULT 'pending',
    auction_order INT,
    auction_start_time DATETIME,
    auction_end_time DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (auction_id) REFERENCES auctions(id),
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (winning_team_id) REFERENCES teams(id),
    UNIQUE KEY unique_auction_player (auction_id, player_id)
);

-- Bids table
CREATE TABLE IF NOT EXISTS bids (
    id INT PRIMARY KEY AUTO_INCREMENT,
    auction_id INT NOT NULL,
    player_id INT NOT NULL,
    team_id INT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (auction_id) REFERENCES auctions(id),
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (team_id) REFERENCES teams(id)
);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password, role) 
VALUES ('admin', 'admin@example.com', '$2b$10$5QpThM8UzHx0VeNz1bXHUOiWwXpzIRjhK.qZY9KRQlZI6Qz5ZmXZy', 'admin'); 