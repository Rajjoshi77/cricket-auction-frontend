/**
 * Seed Real Cricket Player Images v3
 * Uses direct Wikimedia Commons file download URLs via the MediaWiki API
 * to get real player photos. Rate-limited to 1 request/2 seconds.
 *
 * Run with: node src/scripts/seed-real-images-v3.js
 */

require('dotenv').config();
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const db = require('../config/db.config');

// For players we know the exact Wikimedia Commons filename
// Source: https://commons.wikimedia.org/wiki/File:<filename>
// Using the /w/api.php endpoint to get the direct image URL
const WIKI_FILES = {
    'Virat Kumar':      'Virat_Kohli_for_the_2023_ICC_World_Cup.jpg',
    'Rohit Sharma':     'Rohit_Sharma,_2019.jpg',
    'KL Rahul':         'KL_Rahul_in_Johor_Bahru.jpg',
    'Shubman Gill':     'Shubman_Gill_2023.jpg',
    'Suryakumar Yadav': 'Suryakumar_Yadav_2023.jpg',
    'Rishabh Pant':     'Rishabh_Pant_2023.jpg',
    'Hardik Pandya':    'Hardik_Pandya_2023.jpg',
    'Jasprit Bumrah':   'Jasprit_Bumrah_cropped.jpg',
    'Mohammed Shami':   'Mohammed_Shami_2023.jpg',
    'Kuldeep Yadav':    'Kuldeep_Yadav_2023.jpg',
    'Yuzvendra Chahal': 'Yuzvendra_Chahal_2018.jpg',
    'MS Dhoni':         'MS_Dhoni_2011.jpg',
    'James Anderson':   'James_Anderson_cricketer.jpg',
    'Joe Root':         'Joe_Root_2023.jpg',
    'Jos Buttler':      'Jos_Buttler_2023.jpg',
    'Jofra Archer':     'Jofra_Archer_2019.jpg',
    'Jonny Bairstow':   'Jonny_Bairstow_2019.jpg',
    'Ben Stokes':       'Ben_Stokes_2023.jpg',
    'Steve Smith':      'Steve_Smith_at_the_2015_World_Cup.jpg',
    'Mitchell Starc':   'Mitchell_Starc_2023.jpg',
    'David Warner':     'David_Warner_cricket.jpg',
    'Pat Cummins':      'Pat_Cummins_2023.jpg',
    'Glenn Maxwell':    'Glenn_Maxwell_cricketer.jpg',
    'Travis Head':      'Travis_Head_2023.jpg',
    'Kane Williamson':  'Kane_Williamson_2021.jpg',
    'Rashid Khan':      'Rashid_Khan_cricketer_2018.jpg',
    'Babar Azam':       'Babar_Azam_2023.jpg',
    'Shaheen Afridi':   'Shaheen_Shah_Afridi_2023.jpg',
    'Mohammad Rizwan':  'Mohammad_Rizwan_2023.jpg',
    'Quinton de Kock':  'Quinton_de_Kock_2023.jpg',
    'Kagiso Rabada':    'Kagiso_Rabada_2023.jpg',
    'Aiden Markram':    'Aiden_Markram_2023.jpg',
    'Kieron Pollard':   'Kieron_Pollard_2019.jpg',
    'Andre Russell':    'Andre_Russell_cricketer.jpg',
    'Nicholas Pooran':  'Nicholas_Pooran_2022.jpg',
};

const UPLOADS_DIR = path.join(__dirname, '../../uploads/players');
const sleep = ms => new Promise(r => setTimeout(r, ms));

function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }

// Use Wikimedia API to get image URL from filename
async function getWikimediaImageUrl(filename) {
    return new Promise((resolve, reject) => {
        const encodedFilename = encodeURIComponent(filename.replace(/ /g, '_'));
        const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=File:${encodedFilename}&prop=imageinfo&iiprop=url&iiurlwidth=400&format=json`;
        
        https.get(apiUrl, {
            headers: { 'User-Agent': 'CricketAuctionApp/1.0 (contact@example.com)' }
        }, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const pages = json.query?.pages;
                    const page = Object.values(pages)[0];
                    const url = page?.imageinfo?.[0]?.thumburl || page?.imageinfo?.[0]?.url;
                    if (url) resolve(url);
                    else reject(new Error('No image URL'));
                } catch(e) { reject(e); }
            });
        }).on('error', reject);
    });
}

function downloadFile(url, filePath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filePath);
        const client = url.startsWith('https') ? https : http;
        client.get(url, {
            headers: { 'User-Agent': 'CricketAuctionApp/1.0' }
        }, res => {
            if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
                file.close(); fs.unlink(filePath, () => {});
                return downloadFile(res.headers.location, filePath).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                file.close(); fs.unlink(filePath, () => {});
                return reject(new Error(`HTTP ${res.statusCode}`));
            }
            res.pipe(file);
            file.on('finish', () => { file.close(); resolve(); });
        }).on('error', e => { file.close(); fs.unlink(filePath, () => {}); reject(e); });
    });
}

function getAvatarUrl(firstName, lastName) {
    const name = encodeURIComponent(`${firstName} ${lastName}`);
    return `https://ui-avatars.com/api/?name=${name}&background=0d1b2a&color=00d2ff&size=400&bold=true&font-size=0.33&format=png`;
}

async function run() {
    ensureDir(UPLOADS_DIR);
    const [players] = await db.query('SELECT id, first_name, last_name FROM players ORDER BY id');
    console.log(`\nDownloading images for ${players.length} players...\n`);

    let wiki = 0, av = 0, fail = 0;

    for (const player of players) {
        const fullName = `${player.first_name} ${player.last_name}`;
        const slug = fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const wikiFile = WIKI_FILES[fullName];

        process.stdout.write(`  [${String(player.id).padStart(2)}] ${fullName.padEnd(22)}...`);

        let done = false;

        if (wikiFile) {
            try {
                const imgUrl = await getWikimediaImageUrl(wikiFile);
                const ext = imgUrl.includes('.png') ? 'png' : 'jpg';
                const filename = `player-${player.id}-${slug}.${ext}`;
                await downloadFile(imgUrl, path.join(UPLOADS_DIR, filename));
                await db.query('UPDATE players SET profile_image_url=? WHERE id=?', [`uploads/players/${filename}`, player.id]);
                console.log(` ✅ Wikipedia`);
                wiki++; done = true;
            } catch(e) {
                process.stdout.write(` ⚠️  ${e.message} → `);
            }
        }

        if (!done) {
            try {
                const filename = `player-${player.id}-${slug}.png`;
                await downloadFile(getAvatarUrl(player.first_name, player.last_name), path.join(UPLOADS_DIR, filename));
                await db.query('UPDATE players SET profile_image_url=? WHERE id=?', [`uploads/players/${filename}`, player.id]);
                console.log(` 🎨 Avatar`);
                av++;
            } catch(e) {
                console.log(` ❌ ${e.message}`);
                fail++;
            }
        }

        await sleep(1000); // 1 req/sec polite rate
    }

    console.log(`\n${'─'.repeat(50)}`);
    console.log(`✅ Wikipedia: ${wiki}  🎨 Avatars: ${av}  ❌ Failed: ${fail}`);
    console.log('Done! Refresh the player list page.\n');
    process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
