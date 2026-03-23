/**
 * Final Cricket Player Image Seeder
 * Uses Wikipedia REST API (page/summary) which correctly returns
 * real player profile thumbnail URLs.
 * Run with: node src/scripts/seed-final-images.js
 */
require('dotenv').config();
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const db = require('../config/db.config');

// Wikipedia page titles for each player
const WIKI_PAGES = {
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
const sleep = ms => new Promise(r => setTimeout(r, ms));

function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }

function getWikiSummary(pageTitle) {
    return new Promise((resolve, reject) => {
        const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`;
        https.get(url, {
            headers: {
                'User-Agent': 'CricketAuctionApp/1.0 (educational; contact@example.com)',
                'Accept': 'application/json'
            },
            timeout: 10000
        }, res => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                if (res.statusCode !== 200) return reject(new Error(`API status ${res.statusCode}`));
                try {
                    const data = JSON.parse(body);
                    // Get high-res version: thumbnail source but replace width for larger size
                    let imgUrl = data.originalimage?.source || data.thumbnail?.source;
                    if (imgUrl) {
                        // Cap at 400px if it's a thumbnail URL
                        imgUrl = imgUrl.replace(/\/\d+px-/, '/400px-');
                    }
                    resolve(imgUrl || null);
                } catch(e) { reject(e); }
            });
            res.on('error', reject);
        }).on('error', reject);
    });
}

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, {
            headers: { 'User-Agent': 'CricketAuctionApp/1.0' },
            timeout: 20000
        }, res => {
            if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
                file.close(); fs.unlink(dest, ()=>{});
                return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                file.close(); fs.unlink(dest, ()=>{});
                return reject(new Error(`HTTP ${res.statusCode}`));
            }
            res.pipe(file);
            file.on('finish', () => { file.close(); resolve(); });
        }).on('error', e => { file.close(); fs.unlink(dest, ()=>{}); reject(e); });
    });
}

function getAvatar(firstName, lastName) {
    const colors = ['1a237e','006064','1b5e20','880e4f','4a148c','bf360c'];
    const c = colors[(firstName.charCodeAt(0) + lastName.charCodeAt(0)) % colors.length];
    const name = encodeURIComponent(`${firstName} ${lastName}`);
    return `https://ui-avatars.com/api/?name=${name}&background=${c}&color=ffffff&size=400&bold=true&font-size=0.33&format=png`;
}

async function seed() {
    ensureDir(UPLOADS_DIR);
    const [players] = await db.query('SELECT id, first_name, last_name FROM players ORDER BY id');
    console.log(`\nSeeding images for ${players.length} players...\n`);
    let wikiCount=0, avatarCount=0;

    for (const p of players) {
        const name = `${p.first_name} ${p.last_name}`;
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const wikiPage = WIKI_PAGES[name];
        let done = false;

        process.stdout.write(`  [${String(p.id).padStart(2)}] ${name.padEnd(22)}`);

        // Try Wikipedia
        if (wikiPage) {
            try {
                const imgUrl = await getWikiSummary(wikiPage);
                if (imgUrl) {
                    const ext = imgUrl.toLowerCase().includes('.png') ? 'png' : 'jpg';
                    const filename = `player-${p.id}-${slug}.${ext}`;
                    await downloadFile(imgUrl, path.join(UPLOADS_DIR, filename));
                    await db.query('UPDATE players SET profile_image_url=? WHERE id=?', [`uploads/players/${filename}`, p.id]);
                    console.log(` ✅`);
                    wikiCount++; done = true;
                }
            } catch(e) {
                process.stdout.write(` ⚠️ ${e.message} → `);
            }
        }

        // Fallback avatar
        if (!done) {
            try {
                const filename = `player-${p.id}-${slug}.png`;
                await downloadFile(getAvatar(p.first_name, p.last_name), path.join(UPLOADS_DIR, filename));
                await db.query('UPDATE players SET profile_image_url=? WHERE id=?', [`uploads/players/${filename}`, p.id]);
                console.log(` 🎨 Avatar`);
                avatarCount++;
            } catch(e) {
                console.log(` ❌`);
            }
        }

        await sleep(1200); // polite rate limit
    }

    console.log(`\n✅ Wikipedia: ${wikiCount}  🎨 Avatars: ${avatarCount}\nDone!\n`);
    process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
