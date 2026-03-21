/**
 * Upload event group photos to Vercel Blob
 *
 * Reads photos from data/events/photos/
 * Uploads to Vercel Blob under events/photos/
 * Updates Redis with photo URLs
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
const REDIS_URL = (process.env.KINNST_KV_REST_API_URL || '').replace(/"/g, '');
const REDIS_TOKEN = (process.env.KINNST_KV_REST_API_TOKEN || '').replace(/"/g, '');

if (!BLOB_TOKEN) { console.error('Missing BLOB_READ_WRITE_TOKEN'); process.exit(1); }
if (!REDIS_URL || !REDIS_TOKEN) { console.error('Missing Redis credentials'); process.exit(1); }

// Photo filename → event name mapping
const PHOTO_TO_EVENT = {
  'kinn-1.jpg': 'KINN#1',
  'kinn-2.jpg': 'KINN#2',
  'kinn-3.jpg': 'KINN#3',
  'kinn-4.jpg': 'KINN#4',
  'kinn-5.jpg': 'KINN#5',
  'kinn-6.jpg': 'KINN#6',
  'kinn-7.jpg': 'KINN#7',
  'kinn-8.jpg': 'KINN#8',
  'kinn-9.jpg': 'KINN#9',
  'kinn-10.jpg': 'KINN#10',
  'kinn-11.jpg': 'KINN#11',
  'kinn-12.jpg': 'KINN#12',
  'kinn-13.jpg': 'KINN#13',
  'kinn-14.jpg': 'KINN#14',
  'kinn-15.jpg': 'KINN#15',
  'kinn-15-kufstein.jpg': 'KINN#15 Kufstein',
  'kinn-16.jpg': 'KINN#16',
  'kinn-17.jpg': 'KINN#17',
  'kinn-17-kufstein.jpg': 'KINN#17 Kufstein',
};

async function redisCmd(cmd, args) {
  const res = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([cmd, ...args]),
  });
  if (!res.ok) throw new Error(`Redis error: ${res.status}`);
  return res.json();
}

async function redisGet(key) {
  const res = await redisCmd('GET', [`lab:${key}`]);
  return res.result ? JSON.parse(res.result) : null;
}

async function redisSet(key, value) {
  return redisCmd('SET', [`lab:${key}`, JSON.stringify(value)]);
}

async function upload() {
  console.log('=== Upload Event Photos to Vercel Blob ===\n');

  const files = readdirSync(PHOTOS_DIR).filter(f => f.endsWith('.jpg'));
  console.log(`Found ${files.length} photos\n`);

  // Load event index to find Redis keys by event name
  const index = await redisGet('events:index');
  if (!index) { console.error('No events:index in Redis'); process.exit(1); }

  const eventsByName = {};
  for (const entry of index) {
    const event = await redisGet(`events:${entry.id}`);
    if (event) eventsByName[event.name] = event;
  }

  for (const file of files) {
    const eventName = PHOTO_TO_EVENT[file];
    if (!eventName) { console.log(`  SKIP: ${file} (no mapping)`); continue; }

    const event = eventsByName[eventName];
    if (!event) { console.log(`  SKIP: ${file} → ${eventName} (not in Redis)`); continue; }

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

    // Update Redis event with photo URL
    event.groupPhoto = url;
    await redisSet(`events:${event.id}`, event);
    console.log(`    → Redis updated: lab:events:${event.id}`);
  }

  console.log('\nDone.');
}

upload().catch(err => { console.error('Upload failed:', err); process.exit(1); });
