-- Insert sample player categories
INSERT INTO player_categories (category_name, base_price) VALUES
('Batsman', 2000000),
('Bowler', 2000000),
('All-Rounder', 2500000),
('Wicket-Keeper', 1800000)
ON DUPLICATE KEY UPDATE category_name = VALUES(category_name);

-- Insert sample players
INSERT INTO players (first_name, last_name, date_of_birth, nationality, specialization, category_id, base_price, image_url) VALUES
('Virat', 'Kohli', '1988-11-05', 'Indian', 'Batsman', 1, 5000000, 'https://example.com/virat.jpg'),
('Rohit', 'Sharma', '1987-04-30', 'Indian', 'Batsman', 1, 5000000, 'https://example.com/rohit.jpg'),
('Jasprit', 'Bumrah', '1993-12-06', 'Indian', 'Bowler', 2, 4500000, 'https://example.com/bumrah.jpg'),
('Ben', 'Stokes', '1991-06-04', 'English', 'All-Rounder', 3, 4800000, 'https://example.com/stokes.jpg'),
('MS', 'Dhoni', '1981-07-07', 'Indian', 'Wicket-Keeper', 4, 5000000, 'https://example.com/dhoni.jpg'),
('Kane', 'Williamson', '1990-08-08', 'New Zealand', 'Batsman', 1, 4000000, 'https://example.com/kane.jpg'),
('Mitchell', 'Starc', '1990-01-30', 'Australian', 'Bowler', 2, 4200000, 'https://example.com/starc.jpg'),
('Hardik', 'Pandya', '1993-10-11', 'Indian', 'All-Rounder', 3, 4500000, 'https://example.com/pandya.jpg'),
('Jos', 'Buttler', '1990-09-08', 'English', 'Wicket-Keeper', 4, 4000000, 'https://example.com/buttler.jpg'),
('David', 'Warner', '1986-10-27', 'Australian', 'Batsman', 1, 4500000, 'https://example.com/warner.jpg')
ON DUPLICATE KEY UPDATE
    first_name = VALUES(first_name),
    last_name = VALUES(last_name);

-- Initialize player statistics
INSERT INTO player_statistics (player_id, matches_played, runs_scored, wickets_taken, batting_average, bowling_average)
SELECT player_id, 0, 0, 0, 0, 0 FROM players
ON DUPLICATE KEY UPDATE
    matches_played = VALUES(matches_played),
    runs_scored = VALUES(runs_scored); 