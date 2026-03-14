INSERT INTO player_statistics
(player_id, matches_played, runs_scored, wickets_taken, batting_average, bowling_average, updated_at)
SELECT 
    p.id,
    FLOOR(RAND()*200),
    FLOOR(RAND()*7000),
    FLOOR(RAND()*300),
    ROUND(20 + RAND()*40, 2),
    ROUND(18 + RAND()*35, 2),
    CURRENT_TIMESTAMP
FROM players p
ON DUPLICATE KEY UPDATE
    matches_played = VALUES(matches_played),
    runs_scored = VALUES(runs_scored),
    wickets_taken = VALUES(wickets_taken),
    batting_average = VALUES(batting_average),
    bowling_average = VALUES(bowling_average),
    updated_at = CURRENT_TIMESTAMP;