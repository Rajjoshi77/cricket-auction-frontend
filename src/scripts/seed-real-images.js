/**
 * Seed Real Cricket Player Images
 * Downloads real Wikipedia/Wikimedia images for all 35 players.
 * Run with: node src/scripts/seed-real-images.js
 */

require('dotenv').config();
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const db = require('../config/db.config');

// Verified, real Wikipedia Wikimedia Commons image URLs for each player
// Using thumb URLs for smaller file sizes (300-400px)
const PLAYER_IMAGES = {
    // India
    'Virat Kumar':      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Virat_Kohli_in_2018.jpg/300px-Virat_Kohli_in_2018.jpg',
    'Rohit Sharma':     'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Rohit_Sharma_in_2019.jpg/300px-Rohit_Sharma_in_2019.jpg',
    'KL Rahul':         'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/KL_Rahul_%282019%29.jpg/300px-KL_Rahul_%282019%29.jpg',
    'Shubman Gill':     'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Shubman_Gill_%282022%29.jpg/300px-Shubman_Gill_%282022%29.jpg',
    'Suryakumar Yadav': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Suryakumar_Yadav_2022.jpg/300px-Suryakumar_Yadav_2022.jpg',
    'Rishabh Pant':     'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Rishabh_Pant_%282022%29.jpg/300px-Rishabh_Pant_%282022%29.jpg',
    'Hardik Pandya':    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Hardik_Pandya_%282022%29.jpg/300px-Hardik_Pandya_%282022%29.jpg',
    'Jasprit Bumrah':   'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Jasprit_Bumrah_cropped.jpg/300px-Jasprit_Bumrah_cropped.jpg',
    'Mohammed Shami':   'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Mohammed_Shami_%282021%29.jpg/300px-Mohammed_Shami_%282021%29.jpg',
    'Kuldeep Yadav':    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Kuldeep_Yadav_%282022%29.jpg/300px-Kuldeep_Yadav_%282022%29.jpg',
    'Yuzvendra Chahal': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Yuzvendra_Chahal_2018.jpg/300px-Yuzvendra_Chahal_2018.jpg',
    'MS Dhoni':         'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/MS_Dhoni_2011.jpg/300px-MS_Dhoni_2011.jpg',

    // England
    'James Anderson':   'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/James_Anderson_bowling_at_Lord%27s.jpg/300px-James_Anderson_bowling_at_Lord%27s.jpg',
    'Joe Root':         'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Joe_Root_in_2019.jpg/300px-Joe_Root_in_2019.jpg',
    'Jos Buttler':      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Jos_Buttler_%282019%29.jpg/300px-Jos_Buttler_%282019%29.jpg',
    'Jofra Archer':     'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Jofra_Archer_%282019%29.jpg/300px-Jofra_Archer_%282019%29.jpg',
    'Jonny Bairstow':   'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Jonny_Bairstow_%282019%29.jpg/300px-Jonny_Bairstow_%282019%29.jpg',
    'Ben Stokes':       'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Ben_Stokes_in_2022.jpg/300px-Ben_Stokes_in_2022.jpg',

    // Australia
    'Steve Smith':      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Steve_Smith_%28cricketer%29_in_2019.jpg/300px-Steve_Smith_%28cricketer%29_in_2019.jpg',
    'Mitchell Starc':   'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Mitchell_Starc_%282022%29.jpg/300px-Mitchell_Starc_%282022%29.jpg',
    'David Warner':     'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/David_Warner_%28cricket%29.jpg/300px-David_Warner_%28cricket%29.jpg',
    'Pat Cummins':      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Pat_Cummins_%282022%29.jpg/300px-Pat_Cummins_%282022%29.jpg',
    'Glenn Maxwell':    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Glenn_Maxwell_%282022%29.jpg/300px-Glenn_Maxwell_%282022%29.jpg',
    'Travis Head':      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Travis_Head_%282022%29.jpg/300px-Travis_Head_%282022%29.jpg',

    // New Zealand
    'Kane Williamson':  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Kane_Williamson_%282019%29.jpg/300px-Kane_Williamson_%282019%29.jpg',

    // Afghanistan
    'Rashid Khan':      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Rashid_Khan_%282018%29.jpg/300px-Rashid_Khan_%282018%29.jpg',

    // Pakistan
    'Babar Azam':       'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Babar_Azam_%282022%29.jpg/300px-Babar_Azam_%282022%29.jpg',
    'Shaheen Afridi':   'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Shaheen_Afridi_%282022%29.jpg/300px-Shaheen_Afridi_%282022%29.jpg',
    'Mohammad Rizwan':  'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Mohammad_Rizwan_%282022%29.jpg/300px-Mohammad_Rizwan_%282022%29.jpg',

    // South Africa
    'Quinton de Kock':  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Quinton_de_Kock_%282022%29.jpg/300px-Quinton_de_Kock_%282022%29.jpg',
    'Kagiso Rabada':    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Kagiso_Rabada_%282022%29.jpg/300px-Kagiso_Rabada_%282022%29.jpg',
    'Aiden Markram':    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Aiden_Markram_%282022%29.jpg/300px-Aiden_Markram_%282022%29.jpg',

    // West Indies
    'Kieron Pollard':   'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Kieron_Pollard_%282019%29.jpg/300px-Kieron_Pollard_%282019%29.jpg',
    'Andre Russell':    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Andre_Russell_%282019%29.jpg/300px-Andre_Russell_%282019%29.jpg',
    'Nicholas Pooran':  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Nicholas_Pooran_%282022%29.jpg/300px-Nicholas_Pooran_%282022%29.jpg',
};

const UPLOADS_DIR = path.join(__dirname, '../../uploads/players');

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function getAvatarUrl(firstName, lastName) {
    const colors = ['1a237e', '1b5e20', '880e4f', '4a148c', 'e65100', '006064'];
    const color = colors[(firstName.charCodeAt(0) + lastName.charCodeAt(0)) % colors.length];
    const initials = encodeURIComponent(`${firstName[0]}${lastName[0]}`);
    return `https://ui-avatars.com/api/?name=${initials}&background=${color}&color=ffffff&size=300&bold=true&font-size=0.6&format=png`;
}

function downloadImage(url, filePath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filePath);
        const client = url.startsWith('https') ? https : http;

        const req = client.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 Cricket-Auction-Seeder/1.0' },
            timeout: 20000
        }, (res) => {
            // Follow redirect
            if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
                file.close();
                fs.unlink(filePath, () => {});
                return downloadImage(res.headers.location, filePath).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                file.close();
                fs.unlink(filePath, () => {});
                return reject(new Error(`HTTP ${res.statusCode}`));
            }
            res.pipe(file);
            file.on('finish', () => { file.close(); resolve(); });
            file.on('error', (e) => { file.close(); fs.unlink(filePath, () => {}); reject(e); });
        });

        req.on('error', (e) => { file.close(); fs.unlink(filePath, () => {}); reject(e); });
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    });
}

async function seedImages() {
    ensureDir(UPLOADS_DIR);

    const [players] = await db.query('SELECT id, first_name, last_name FROM players ORDER BY id');
    console.log(`\nFound ${players.length} players. Downloading real images...\n`);

    let success = 0, fallback = 0, failed = 0;

    for (const player of players) {
        const fullName = `${player.first_name} ${player.last_name}`;
        const slug = `${player.first_name}-${player.last_name}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const filename = `player-${player.id}-${slug}.jpg`;
        const filePath = path.join(UPLOADS_DIR, filename);
        const dbPath = `uploads/players/${filename}`;

        const imageUrl = PLAYER_IMAGES[fullName];

        if (imageUrl) {
            try {
                process.stdout.write(`  Downloading ${fullName}...`);
                await downloadImage(imageUrl, filePath);
                await db.query('UPDATE players SET profile_image_url = ? WHERE id = ?', [dbPath, player.id]);
                console.log(` ✅ (Wikipedia)`);
                success++;
                continue;
            } catch (err) {
                console.log(` ⚠️ Wikipedia failed (${err.message}), trying avatar...`);
            }
        }

        // Fallback to avatar
        try {
            const avatarFilename = `player-${player.id}-${slug}.png`;
            const avatarPath = path.join(UPLOADS_DIR, avatarFilename);
            const avatarDbPath = `uploads/players/${avatarFilename}`;
            await downloadImage(getAvatarUrl(player.first_name, player.last_name), avatarPath);
            await db.query('UPDATE players SET profile_image_url = ? WHERE id = ?', [avatarDbPath, player.id]);
            console.log(`  ✅ ${fullName} [Avatar fallback]`);
            fallback++;
        } catch (err2) {
            console.log(`  ❌ ${fullName} completely failed: ${err2.message}`);
            failed++;
        }
    }

    console.log(`\n${'─'.repeat(50)}`);
    console.log(`✅ Wikipedia images: ${success}`);
    console.log(`🎨 Avatar fallbacks: ${fallback}`);
    if (failed > 0) console.log(`❌ Failed: ${failed}`);
    console.log(`${'─'.repeat(50)}\nDone! Refresh the player list to see images.\n`);

    process.exit(0);
}

seedImages().catch((err) => {
    console.error('Fatal:', err);
    process.exit(1);
});
