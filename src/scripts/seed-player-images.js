/**
 * Player Image Seeder
 * Downloads real cricket player images server-side (no CORS issues)
 * and updates the database with local paths.
 *
 * Run with: node src/scripts/seed-player-images.js
 */

require('dotenv').config();
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const db = require('../config/db.config');

// Map player names to Wikipedia portrait image URLs
const PLAYER_IMAGE_MAP = {
    'Virat Kumar':      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Virat_Kohli_in_2018.jpg/330px-Virat_Kohli_in_2018.jpg',
    'Rohit Sharma':     'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Rohit_Sharma_at_the_toss.jpg/330px-Rohit_Sharma_at_the_toss.jpg',
    'MS Dhoni':         'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/MS_Dhoni_2011.jpg/330px-MS_Dhoni_2011.jpg',
    'James Anderson':   'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/James_Anderson_bowling_at_Lord%27s.jpg/330px-James_Anderson_bowling_at_Lord%27s.jpg',
    'Steve Smith':      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Steve_Smith_%28cricketer%29_in_2019.jpg/330px-Steve_Smith_%28cricketer%29_in_2019.jpg',
    'David Warner':     'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/David_Warner_%28cricket%29.jpg/330px-David_Warner_%28cricket%29.jpg',
    'Kane Williamson':  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Kane_Williamson_%282019%29.jpg/330px-Kane_Williamson_%282019%29.jpg',
    'Ben Stokes':       'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Ben_Stokes_in_2022.jpg/330px-Ben_Stokes_in_2022.jpg',
    'Pat Cummins':      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Pat_Cummins_%282022%29.jpg/330px-Pat_Cummins_%282022%29.jpg',
    'Jasprit Bumrah':   'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Jasprit_Bumrah_cropped.jpg/330px-Jasprit_Bumrah_cropped.jpg',
};

// Fallback: generate a styled avatar URL using ui-avatars.com
function getAvatarUrl(firstName, lastName) {
    const name = encodeURIComponent(`${firstName}+${lastName}`);
    return `https://ui-avatars.com/api/?name=${name}&background=1a237e&color=00d2ff&size=300&bold=true&font-size=0.4`;
}

// Upload directory
const UPLOADS_DIR = path.join(__dirname, '../../uploads/players');

// Ensure uploads/players directory exists
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// Download an image from a URL and save to local path
function downloadImage(url, filePath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filePath);
        const client = url.startsWith('https') ? https : http;

        const request = client.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; CricketAuctionBot/1.0)'
            },
            timeout: 15000
        }, (response) => {
            // Handle redirects
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                file.close();
                fs.unlink(filePath, () => {});
                return downloadImage(response.headers.location, filePath)
                    .then(resolve).catch(reject);
            }

            if (response.statusCode !== 200) {
                file.close();
                fs.unlink(filePath, () => {});
                return reject(new Error(`HTTP ${response.statusCode}`));
            }

            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(true);
            });
        });

        request.on('error', (err) => {
            file.close();
            fs.unlink(filePath, () => {});
            reject(err);
        });

        request.on('timeout', () => {
            request.destroy();
            file.close();
            fs.unlink(filePath, () => {});
            reject(new Error('Request timed out'));
        });
    });
}

async function seedPlayerImages() {
    ensureDir(UPLOADS_DIR);

    console.log('Fetching all players from database...\n');
    const [players] = await db.query(
        'SELECT id, first_name, last_name, profile_image_url FROM players ORDER BY id'
    );

    console.log(`Found ${players.length} players. Downloading images...\n`);

    for (const player of players) {
        const fullName = `${player.first_name} ${player.last_name}`;
        const filename = `player-${player.id}-${player.first_name.toLowerCase()}-${player.last_name.toLowerCase()}.jpg`
            .replace(/[^a-z0-9\-\.]/g, '-');
        const filePath = path.join(UPLOADS_DIR, filename);
        const dbPath = `uploads/players/${filename}`;

        // Skip if already has a local file
        if (player.profile_image_url && player.profile_image_url.startsWith('uploads/')) {
            console.log(`  ✓ SKIP (already local): ${fullName}`);
            continue;
        }

        // Pick image URL: known player map or avatar fallback
        const imageUrl = PLAYER_IMAGE_MAP[fullName] || getAvatarUrl(player.first_name, player.last_name);
        const source = PLAYER_IMAGE_MAP[fullName] ? 'Wikipedia' : 'Avatar';

        try {
            await downloadImage(imageUrl, filePath);

            // Update database
            await db.query(
                'UPDATE players SET profile_image_url = ? WHERE id = ?',
                [dbPath, player.id]
            );

            console.log(`  ✅ ${fullName} [${source}] -> ${dbPath}`);
        } catch (err) {
            console.log(`  ⚠️  ${fullName} failed (${err.message}). Trying avatar fallback...`);
            try {
                const avatarUrl = getAvatarUrl(player.first_name, player.last_name);
                await downloadImage(avatarUrl, filePath);
                await db.query(
                    'UPDATE players SET profile_image_url = ? WHERE id = ?',
                    [dbPath, player.id]
                );
                console.log(`  ✅ ${fullName} [Avatar fallback] -> ${dbPath}`);
            } catch (err2) {
                console.log(`  ❌ ${fullName} completely failed: ${err2.message}`);
            }
        }
    }

    console.log('\n✅ Done! All player images processed.');
    process.exit(0);
}

seedPlayerImages().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
