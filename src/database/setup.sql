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
    base_budget_per_team DECIMAL(10, 2) NOT NULL DEFAULT 1000000.00,
    venue VARCHAR(255),
    description TEXT,
    status ENUM('upcoming', 'ongoing', 'completed') DEFAULT 'upcoming',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
    base_price DECIMAL(10, 2) NOT NULL,
    status ENUM('available', 'unavailable', 'injured') DEFAULT 'available',
    profile_image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Auctions table
CREATE TABLE IF NOT EXISTS auctions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    tournament_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    min_purse DECIMAL(10, 2) NOT NULL,
    status ENUM('upcoming', 'active', 'completed') DEFAULT 'upcoming',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
);

-- Team Registrations table
CREATE TABLE IF NOT EXISTS team_registrations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    auction_id INT NOT NULL,
    team_id INT NOT NULL,
    purse_amount DECIMAL(10, 2) NOT NULL,
    remaining_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (auction_id) REFERENCES auctions(id),
    FOREIGN KEY (team_id) REFERENCES teams(id)
);

-- Auction Players table
CREATE TABLE IF NOT EXISTS auction_players (
    id INT PRIMARY KEY AUTO_INCREMENT,
    auction_id INT NOT NULL,
    player_id INT NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    sold_price DECIMAL(10, 2),
    winning_team_id INT,
    status ENUM('unsold', 'sold', 'pending') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (auction_id) REFERENCES auctions(id),
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (winning_team_id) REFERENCES teams(id)
);

-- Bids table
CREATE TABLE IF NOT EXISTS bids (
    id INT PRIMARY KEY AUTO_INCREMENT,
    auction_id INT NOT NULL,
    player_id INT NOT NULL,
    team_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (auction_id) REFERENCES auctions(id),
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (team_id) REFERENCES teams(id)
);

-- Insert admin user (password: admin123)
INSERT INTO users (username, email, password, role) 
VALUES ('admin', 'admin@example.com', '$2b$10$5QpThM8UzHx0VeNz1bXHUOiWwXpzIRjhK.qZY9KRQlZI6Qz5ZmXZy', 'admin');

-- Insert sample team owner
INSERT INTO users (username, email, password, role)
VALUES ('owner1', 'owner1@example.com', '$2b$10$5QpThM8UzHx0VeNz1bXHUOiWwXpzIRjhK.qZY9KRQlZI6Qz5ZmXZy', 'team_owner');

-- Insert sample team
INSERT INTO teams (name, owner_id, logo_url)
VALUES ('Mumbai Indians', 2, 'https://example.com/mi_logo.png');

-- Insert sample tournament
INSERT INTO tournaments (
    tournament_name, 
    season_year,
    start_date, 
    end_date, 
    registration_deadline,
    venue,
    description
) VALUES (
    'IPL 2024',
    2024,
    '2024-03-01',
    '2024-05-30',
    '2024-02-15',
    'Multiple Venues, India',
    'Indian Premier League 2024 Season'
);

-- Insert sample players
INSERT INTO players (first_name, last_name, age, country, role, specialization, base_price, profile_image_url)
VALUES 
('Virat', 'Kohli', 32, 'India', 'batsman', 'right_handed', 2000000.00, 'https://example.com/kohli.jpg'),
('MS', 'Dhoni', 39, 'India', 'wicket_keeper', 'right_handed', 1800000.00, 'https://example.com/dhoni.jpg'),
('Ben', 'Stokes', 29, 'England', 'all_rounder', 'left_handed', 1500000.00, 'https://example.com/stokes.jpg');

-- Insert sample auction
INSERT INTO auctions (name, tournament_id, start_time, end_time, min_purse)
VALUES ('IPL 2024 Auction', 1, '2024-02-15 10:00:00', '2024-02-15 18:00:00', 5000000.00);

-- Add players to auction
INSERT INTO auction_players (auction_id, player_id, base_price)
SELECT 1, id, base_price FROM players; 