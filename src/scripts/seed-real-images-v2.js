/**
 * Seed Real Cricket Player Images - Rate-Limited Version
 * Uses Wikimedia REST API with delays to avoid rate limiting.
 * Run with: node src/scripts/seed-real-images-v2.js
 */

require('dotenv').config();
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const db = require('../config/db.config');

// Map player DB names to their Wikipedia page titles
// We use the Wikimedia REST API: /page/summary/{title} to get thumbnail URL
const PLAYER_WIKI = {
    'Virat Kumar':      'Virat_Kohli',
    'Rohit Sharma':     'Rohit_Sharma',
    'KL Rahul':         'KL_Rahul',
    'Shubman Gill':     'Shubman_Gill',
    'Suryakumar Yadav': 'Suryakumar_Yadav',
    'Rishabh Pant':     'Rishabh_Pant',
    'Hardik Pandya':    'Hardik_Pandya',
    'Jasprit Bumrah':   'Jasprit_Bumrah',
    'Mohammed Shami':   'Mohammed_Shami',
    'Kuldeep Yadav':    'Kuldeep_Yadav',
    'Yuzvendra Chahal': 'Yuzvendra_Chahal',
    'MS Dhoni':         'MS_Dhoni',
    'James Anderson':   'James_Anderson_(cricketer)',
    'Joe Root':         'Joe_Root',
    'Jos Buttler':      'Jos_Buttler',
    'Jofra Archer':     'Jofra_Archer',
    'Jonny Bairstow':   'Jonny_Bairstow',
    'Ben Stokes':       'Ben_Stokes',
    'Steve Smith':      'Steve_Smith_(cricketer)',
    'Mitchell Starc':   'Mitchell_Starc',
    'David Warner':     'David_Warner_(cricketer)',
    'Pat Cummins':      'Pat_Cummins',
    'Glenn Maxwell':    'Glenn_Maxwell_(cricketer)',
    'Travis Head':      'Travis_Head_(cricketer)',
    'Kane Williamson':  'Kane_Williamson',
    'Rashid Khan':      'Rashid_Khan_(cricketer)',
    'Babar Azam':       'Babar_Azam',
    'Shaheen Afridi':   'Shaheen_Shah_Afridi',
    'Mohammad Rizwan':  'Mohammad_Rizwan_(cricketer)',
    'Quinton de Kock':  'Quinton_de_Kock',
    'Kagiso Rabada':    'Kagiso_Rabada',
    'Aiden Markram':    'Aiden_Markram',
    'Kieron Pollard':   'Kieron_Pollard',
    'Andre Russell':    'Andre_Russell_(cricketer)',
    'Nicholas Pooran':  'Nicholas_Pooran',
};

const UPLOADS_DIR = path.join(__dirname, '../../uploads/players');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function httpGet(url, options = {}) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const req = client.get(url, {
            headers: {
                'User-Agent': 'CricketAuction/1.0 (educational project; contact@example.com)',
                'Accept': 'application/json',
                ...options.headers
            },
            timeout: 15000
        }, resolve);
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    });
}

async function getWikipediaThumbnailUrl(pageTitle) {
    const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`;
    const res = await httpGet(apiUrl);
    
    return new Promise((resolve, reject) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            if (res.statusCode !== 200) {
                return reject(new Error(`API ${res.statusCode} for ${pageTitle}`));
            }
            try {
                const json = JSON.parse(data);
                const imgUrl = json.thumbnail?.source || json.originalimage?.source;
                if (imgUrl) resolve(imgUrl);
                else reject(new Error(`No image in Wikipedia summary for ${pageTitle}`));
            } catch (e) {
                reject(new Error(`JSON parse error: ${e.message}`));
            }
        });
    });
}

function downloadImage(url, filePath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filePath);
        const client = url.startsWith('https') ? https : http;

        const req = client.get(url, {
            headers: { 'User-Agent': 'CricketAuction/1.0 (educational)' },
            timeout: 20000
        }, (res) => {
            if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
                file.close(); fs.unlink(filePath, () => {});
                return downloadImage(res.headers.location, filePath).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                file.close(); fs.unlink(filePath, () => {});
                return reject(new Error(`HTTP ${res.statusCode}`));
            }
            res.pipe(file);
            file.on('finish', () => { file.close(); resolve(); });
        });
        req.on('error', e => { file.close(); fs.unlink(filePath, () => {}); reject(e); });
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    });
}

function getAvatarUrl(firstName, lastName) {
    const name = encodeURIComponent(`${firstName} ${lastName}`);
    return `https://ui-avatars.com/api/?name=${name}&background=0d1b2a&color=00d2ff&size=300&bold=true&font-size=0.35&format=png`;
}

async function seedImages() {
    ensureDir(UPLOADS_DIR);
    const [players] = await db.query('SELECT id, first_name, last_name FROM players ORDER BY id');
    console.log(`\nFound ${players.length} players. Downloading real Wikipedia images...\n`);

    let wiki = 0, avatar = 0, failed = 0;

    for (const player of players) {
        const fullName = `${player.first_name} ${player.last_name}`;
        const slug = fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const wikiTitle = PLAYER_WIKI[fullName];

        process.stdout.write(`  [${player.id}] ${fullName}...`);

        let downloaded = false;

        // Try Wikipedia API
        if (wikiTitle) {
            try {
                const thumbUrl = await getWikipediaThumbnailUrl(wikiTitle);
                // Increase thumbnail size to 400px
                const highResUrl = thumbUrl.replace(/\/\d+px-/, '/400px-');
                
                const ext = highResUrl.includes('.png') ? 'png' : 'jpg';
                const filename = `player-${player.id}-${slug}.${ext}`;
                const filePath = path.join(UPLOADS_DIR, filename);
                const dbPath = `uploads/players/${filename}`;

                await downloadImage(highResUrl, filePath);
                await db.query('UPDATE players SET profile_image_url = ? WHERE id = ?', [dbPath, player.id]);
                console.log(` ✅ Wikipedia`);
                wiki++;
                downloaded = true;
            } catch (err) {
                process.stdout.write(` ⚠️ ${err.message} → `);
            }
        }

        // Fallback to ui-avatars
        if (!downloaded) {
            try {
                const filename = `player-${player.id}-${slug}.png`;
                const filePath = path.join(UPLOADS_DIR, filename);
                const dbPath = `uploads/players/${filename}`;
                await downloadImage(getAvatarUrl(player.first_name, player.last_name), filePath);
                await db.query('UPDATE players SET profile_image_url = ? WHERE id = ?', [dbPath, player.id]);
                console.log(`Avatar ✅`);
                avatar++;
            } catch (err2) {
                console.log(`❌ ${err2.message}`);
                failed++;
            }
        }

        // Rate limit: 1 request per 1.5 seconds to respect Wikipedia
        await sleep(1500);
    }

    console.log(`\n${'─'.repeat(50)}`);
    console.log(`✅ Real Wikipedia photos: ${wiki}`);
    console.log(`🎨 Avatar fallbacks:      ${avatar}`);
    if (failed > 0) console.log(`❌ Failed:               ${failed}`);
    console.log(`${'─'.repeat(50)}`);
    process.exit(0);
}

seedImages().catch(err => { console.error(err); process.exit(1); });
