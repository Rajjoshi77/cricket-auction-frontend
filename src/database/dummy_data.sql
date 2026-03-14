USE cricket_auction_system;

-- First, clear existing data (if any)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE bids;
TRUNCATE TABLE team_registrations;
TRUNCATE TABLE auction_players;
TRUNCATE TABLE auctions;
TRUNCATE TABLE players;
TRUNCATE TABLE teams;
TRUNCATE TABLE tournaments;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- Insert Users first (including the existing admin)
INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@example.com', '$2b$10$5QpThM8UzHx0VeNz1bXHUOiWwXpzIRjhK.qZY9KRQlZI6Qz5ZmXZy', 'admin');

-- Insert team owners and get their IDs
INSERT INTO users (username, email, password, role) VALUES
('john_owner', 'john@team1.com', '$2b$10$5QpThM8UzHx0VeNz1bXHUOiWwXpzIRjhK.qZY9KRQlZI6Qz5ZmXZy', 'team_owner'),
('sarah_owner', 'sarah@team2.com', '$2b$10$5QpThM8UzHx0VeNz1bXHUOiWwXpzIRjhK.qZY9KRQlZI6Qz5ZmXZy', 'team_owner'),
('mike_owner', 'mike@team3.com', '$2b$10$5QpThM8UzHx0VeNz1bXHUOiWwXpzIRjhK.qZY9KRQlZI6Qz5ZmXZy', 'team_owner'),
('lisa_owner', 'lisa@team4.com', '$2b$10$5QpThM8UzHx0VeNz1bXHUOiWwXpzIRjhK.qZY9KRQlZI6Qz5ZmXZy', 'team_owner');

-- Now insert Teams with the correct owner_ids
-- Note: owner_ids will be 2,3,4,5 as they were inserted after admin (id=1)
INSERT INTO teams (name, owner_id, logo_url) VALUES
('Mumbai Mavericks', 2, 'https://example.com/mumbai_logo.png'),
('Delhi Dragons', 3, 'https://example.com/delhi_logo.png'),
('Bangalore Bulls', 4, 'https://example.com/bangalore_logo.png'),
('Chennai Champions', 5, 'https://example.com/chennai_logo.png');

-- Insert Tournaments with all required fields
INSERT INTO tournaments (
    tournament_name, 
    season_year,
    start_date, 
    end_date, 
    registration_deadline,
    max_teams,
    min_players_per_team,
    max_players_per_team,
    base_budget_per_team,
    venue,
    description,
    status
) VALUES 
('Summer League 2024', 2024, '2024-05-01', '2024-06-30', '2024-04-15', 8, 15, 25, 1000000.00, 'Mumbai Stadium', 'Summer season premier tournament', 'upcoming'),
('Winter Championship 2024', 2024, '2024-11-15', '2024-12-20', '2024-10-30', 8, 15, 25, 1000000.00, 'Delhi Stadium', 'Winter season championship', 'upcoming'),
('Spring Series 2024', 2024, '2024-03-01', '2024-04-15', '2024-02-15', 8, 15, 25, 1000000.00, 'Bangalore Stadium', 'Spring season series', 'ongoing'),
('Autumn Cup 2023', 2023, '2023-09-01', '2023-10-15', '2023-08-15', 8, 15, 25, 1000000.00, 'Chennai Stadium', 'Autumn season cup', 'completed');

-- Insert Players
INSERT INTO players (first_name, last_name, age, country, role, specialization, base_price, status, profile_image_url) VALUES
('Virat', 'Kumar', 28, 'India', 'batsman', 'right_handed', 1000000.00, 'available', 'https://example.com/virat.jpg'),
('James', 'Anderson', 32, 'England', 'bowler', 'fast', 800000.00, 'available', 'https://example.com/james.jpg'),
('Steve', 'Smith', 31, 'Australia', 'all_rounder', 'right_handed', 1200000.00, 'available', 'https://example.com/steve.jpg'),
('MS', 'Dhoni', 35, 'India', 'wicket_keeper', 'right_handed', 1500000.00, 'available', 'https://example.com/dhoni.jpg'),
('Mitchell', 'Starc', 30, 'Australia', 'bowler', 'fast', 900000.00, 'available', 'https://example.com/starc.jpg'),
('Kane', 'Williamson', 29, 'New Zealand', 'batsman', 'right_handed', 1100000.00, 'available', 'https://example.com/kane.jpg'),
('Rashid', 'Khan', 23, 'Afghanistan', 'bowler', 'spin', 1300000.00, 'available', 'https://example.com/rashid.jpg'),
('Ben', 'Stokes', 29, 'England', 'all_rounder', 'left_handed', 1400000.00, 'available', 'https://example.com/ben.jpg');

-- Insert Auctions
INSERT INTO auctions (name, tournament_id, start_time, end_time, min_purse, status) VALUES
('Summer League Auction 2024', 1, '2024-04-15 10:00:00', '2024-04-15 18:00:00', 5000000.00, 'upcoming'),
('Winter Championship Auction 2024', 2, '2024-10-30 10:00:00', '2024-10-30 18:00:00', 5000000.00, 'upcoming'),
('Spring Series Auction 2024', 3, '2024-02-15 10:00:00', '2024-02-15 18:00:00', 5000000.00, 'completed'),
('Autumn Cup Auction 2023', 4, '2023-08-15 10:00:00', '2023-08-15 18:00:00', 5000000.00, 'completed');

-- Insert Auction Players
INSERT INTO auction_players (auction_id, player_id, base_price, sold_price, winning_team_id, status) VALUES
(3, 1, 1000000.00, 1500000.00, 1, 'sold'),
(3, 2, 800000.00, 1200000.00, 2, 'sold'),
(3, 3, 1200000.00, 1800000.00, 3, 'sold'),
(3, 4, 1500000.00, 2500000.00, 4, 'sold'),
(1, 5, 900000.00, NULL, NULL, 'pending'),
(1, 6, 1100000.00, NULL, NULL, 'pending'),
(1, 7, 1300000.00, NULL, NULL, 'pending'),
(1, 8, 1400000.00, NULL, NULL, 'pending');

-- Insert Team Registrations
INSERT INTO team_registrations (auction_id, team_id, purse_amount, remaining_amount) VALUES
(1, 1, 10000000.00, 10000000.00),
(1, 2, 10000000.00, 10000000.00),
(1, 3, 10000000.00, 10000000.00),
(1, 4, 10000000.00, 10000000.00),
(3, 1, 10000000.00, 8500000.00),
(3, 2, 10000000.00, 8800000.00),
(3, 3, 10000000.00, 8200000.00),
(3, 4, 10000000.00, 7500000.00);

-- Insert Bids (for completed auction)
INSERT INTO bids (auction_id, player_id, team_id, amount) VALUES
(3, 1, 1, 1500000.00),
(3, 1, 2, 1400000.00),
(3, 2, 2, 1200000.00),
(3, 2, 3, 1100000.00),
(3, 3, 3, 1800000.00),
(3, 3, 4, 1700000.00),
(3, 4, 4, 2500000.00),
(3, 4, 1, 2400000.00); 





--players data

INSERT INTO players 
(first_name, last_name, age, country, role, specialization, base_price, status, profile_image_url)
VALUES
('Rohit', 'Sharma', 36, 'India', 'batsman', 'right_handed', 1400000, 'available', ''),
('KL', 'Rahul', 32, 'India', 'batsman', 'right_handed', 1100000, 'available', ''),
('Shubman', 'Gill', 25, 'India', 'batsman', 'right_handed', 1200000, 'available', ''),
('Suryakumar', 'Yadav', 33, 'India', 'batsman', 'right_handed', 1300000, 'available', ''),
('Rishabh', 'Pant', 27, 'India', 'wicket_keeper', 'left_handed', 1500000, 'available', ''),
('Hardik', 'Pandya', 30, 'India', 'all_rounder', 'right_handed', 1600000, 'available', ''),
('Jasprit', 'Bumrah', 31, 'India', 'bowler', 'fast', 1700000, 'available', ''),
('Mohammed', 'Shami', 34, 'India', 'bowler', 'fast', 1200000, 'available', ''),
('Kuldeep', 'Yadav', 29, 'India', 'bowler', 'spin', 900000, 'available', ''),
('Yuzvendra', 'Chahal', 33, 'India', 'bowler', 'spin', 950000, 'available', ''),

('Joe', 'Root', 34, 'England', 'batsman', 'right_handed', 1350000, 'available', ''),
('Jos', 'Buttler', 34, 'England', 'wicket_keeper', 'right_handed', 1500000, 'available', ''),
('Jofra', 'Archer', 29, 'England', 'bowler', 'fast', 1400000, 'available', ''),
('Jonny', 'Bairstow', 35, 'England', 'batsman', 'right_handed', 1250000, 'available', ''),

('David', 'Warner', 38, 'Australia', 'batsman', 'left_handed', 1450000, 'available', ''),
('Pat', 'Cummins', 32, 'Australia', 'bowler', 'fast', 1600000, 'available', ''),
('Glenn', 'Maxwell', 36, 'Australia', 'all_rounder', 'right_handed', 1550000, 'available', ''),
('Travis', 'Head', 31, 'Australia', 'batsman', 'left_handed', 1200000, 'available', ''),

('Babar', 'Azam', 30, 'Pakistan', 'batsman', 'right_handed', 1400000, 'available', ''),
('Shaheen', 'Afridi', 25, 'Pakistan', 'bowler', 'fast', 1350000, 'available', ''),
('Mohammad', 'Rizwan', 32, 'Pakistan', 'wicket_keeper', 'right_handed', 1250000, 'available', ''),

('Quinton', 'de Kock', 33, 'South Africa', 'wicket_keeper', 'left_handed', 1400000, 'available', ''),
('Kagiso', 'Rabada', 29, 'South Africa', 'bowler', 'fast', 1500000, 'available', ''),
('Aiden', 'Markram', 30, 'South Africa', 'batsman', 'right_handed', 1200000, 'available', ''),

('Kieron', 'Pollard', 37, 'West Indies', 'all_rounder', 'right_handed', 1350000, 'available', ''),
('Andre', 'Russell', 36, 'West Indies', 'all_rounder', 'right_handed', 1650000, 'available', ''),
('Nicholas', 'Pooran', 29, 'West Indies', 'wicket_keeper', 'left_handed', 1200000, 'available', '');
