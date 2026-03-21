/**
 * Upload event group photos to Vercel Blob
 *
 * Reads photos from data/events/photos/
 * Uploads to Vercel Blob under events/photos/
 * Updates kinn:event:* hashes with groupPhoto URL
 *
 * Run: node --experimental-modules scripts/upload-event-photos.js
 * Requires: BLOB_READ_WRITE_TOKEN, KINNST_KV_REST_API_URL, KINNST_KV_REST_API_TOKEN
 */

import { put } from '@vercel/blob';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PHOTOS_DIR = join(__dirname, '..', 'data', 'events', 'photos');

// Load env
for (const envFile of ['.env', '.env.local']) {
  try {
    const content = readFileSync(join(__dirname, '..', envFile), 'utf-8');
    content.split('\n').forEach(line => {
      const [key, ...vals] = line.split('=');
      if (key && vals.length && !key.startsWith('#')) {
        process.env[key.trim()] = vals.join('=').trim().replace(/^"|"$/g, '');
      }
    });
  } catch {}
}

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
if (!BLOB_TOKEN) { console.error('Missing BLOB_READ_WRITE_TOKEN'); process.exit(1); }

const { default: kv } = await import('../lib/redis-typed.js');
const raw = kv.raw();

// Photo filename → kinn:event key mapping
const PHOTO_TO_KEY = {
  'kinn-1.jpg': 'kinn:event:1',
  'kinn-2.jpg': 'kinn:event:2',
  'kinn-3.jpg': 'kinn:event:3',
  'kinn-4.jpg': 'kinn:event:4',
  'kinn-5.jpg': 'kinn:event:5',
  'kinn-6.jpg': 'kinn:event:6',
  'kinn-7.jpg': 'kinn:event:7',
  'kinn-8.jpg': 'kinn:event:8',
  'kinn-9.jpg': 'kinn:event:9',
  'kinn-10.jpg': 'kinn:event:10',
  'kinn-11.jpg': 'kinn:event:11',
  'kinn-12.jpg': 'kinn:event:12',
  'kinn-13.jpg': 'kinn:event:13',
  'kinn-14.jpg': 'kinn:event:14',
  'kinn-15.jpg': 'kinn:event:15',
  'kinn-15-kufstein.jpg': 'kinn:event:kufstein:15',
  'kinn-16.jpg': 'kinn:event:16',
  'kinn-17.jpg': 'kinn:event:17',
  'kinn-17-kufstein.jpg': 'kinn:event:kufstein:17',
};

async function upload() {
  console.log('=== Upload Event Photos to Vercel Blob ===\n');

  const files = readdirSync(PHOTOS_DIR).filter(f => f.endsWith('.jpg'));
  console.log(`Found ${files.length} photos\n`);

  for (const file of files) {
    const key = PHOTO_TO_KEY[file];
    if (!key) { console.log(`  SKIP: ${file} (no mapping)`); continue; }

    // Verify event exists
    const exists = await raw.exists(key);
    if (!exists) { console.log(`  SKIP: ${file} → ${key} (not in Redis)`); continue; }

    // Upload to Vercel Blob
    const filePath = join(PHOTOS_DIR, file);
    const fileContent = readFileSync(filePath);
    const blobPath = `events/photos/${file}`;

    console.log(`  Uploading ${file} → ${blobPath}...`);
    const { url } = await put(blobPath, fileContent, {
      access: 'public',
      allowOverwrite: true,
      token: BLOB_TOKEN,
      contentType: 'image/jpeg',
    });
    console.log(`    → ${url}`);

    // Update kinn:event hash with photo URL
    await raw.hset(key, { groupPhoto: url });
    console.log(`    → HSET ${key} groupPhoto`);
  }

  console.log('\nDone.');
}

upload().catch(err => { console.error('Upload failed:', err); process.exit(1); });
