/**
 * Script to clear broken external image URLs from the database.
 * Players with external URLs (Wikimedia, placeholder sites, etc.)
 * will have their profile_image_url set to NULL so the frontend
 * can show the proper default image instantly without blinking.
 *
 * Run with: node src/scripts/fix-broken-images.js
 */

require('dotenv').config();
const db = require('../config/db.config');

const TRUSTED_HOSTS = ['localhost', '127.0.0.1'];

async function fixBrokenImages() {
    try {
        console.log('Connecting to database...');

        // Fetch all players with an image URL that is an external link
        const [players] = await db.query(
            `SELECT id, first_name, last_name, profile_image_url 
             FROM players 
             WHERE profile_image_url IS NOT NULL 
               AND profile_image_url != ''`
        );

        console.log(`Found ${players.length} players with image URLs.`);

        let cleared = 0;
        const toUpdate = [];

        for (const player of players) {
            const url = player.profile_image_url;
            // Keep local paths (e.g., "uploads/...") and trusted hosts
            if (url.startsWith('uploads/') || url.startsWith('/uploads/')) {
                console.log(`  ✓ KEEP local: ${player.first_name} ${player.last_name} -> ${url}`);
                continue;
            }

            if (url.startsWith('http')) {
                try {
                    const parsed = new URL(url);
                    if (TRUSTED_HOSTS.includes(parsed.hostname)) {
                        console.log(`  ✓ KEEP localhost: ${player.first_name} ${player.last_name}`);
                        continue;
                    }
                } catch {
                    // Malformed URL, clear it
                }
                // It's an external URL - clear it
                console.log(`  ✗ CLEAR external: ${player.first_name} ${player.last_name} -> ${url}`);
                toUpdate.push(player.id);
                cleared++;
            }
        }

        if (toUpdate.length > 0) {
            await db.query(
                'UPDATE players SET profile_image_url = NULL WHERE id IN (?)',
                [toUpdate]
            );
            console.log(`\n✅ Cleared ${cleared} broken external image URLs.`);
        } else {
            console.log('\n✅ No broken URLs found. All images are local.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixBrokenImages();
