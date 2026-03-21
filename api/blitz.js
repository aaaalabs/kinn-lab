import kv from '../lib/redis-typed.js';

// Rate limit: max 3 submissions per IP per hour
const RATE_LIMIT = 3;
const RATE_WINDOW = 60 * 60; // 1 hour in seconds

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { text, vorname } = req.body || {};

    if (!text || typeof text !== 'string' || text.trim().length < 3) {
      return res.status(400).json({ error: 'Bitte mindestens ein paar Worte.' });
    }

    if (text.length > 500) {
      return res.status(400).json({ error: 'Maximal 500 Zeichen.' });
    }

    // Rate limiting by IP
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
    const rateKey = `blitz:rate:${ip}`;
    const count = await kv.get(rateKey);

    if (count && parseInt(count) >= RATE_LIMIT) {
      return res.status(429).json({ error: 'Zu viele Einreichungen. Bitte später nochmal.' });
    }

    // Store the Stimme
    const stimme = {
      text: text.trim(),
      vorname: vorname?.trim()?.substring(0, 50) || null,
      approved: false,
      createdAt: new Date().toISOString(),
      source: 'blitz',
      ip: ip.substring(0, 15), // truncate for privacy
    };

    // Store with unique ID
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    stimme.id = id;
    await kv.set(`blitz:${id}`, stimme);
    await kv.sadd('blitz:all', id);

    // Rate limit (increment via set with TTL)
    const newCount = (parseInt(count) || 0) + 1;
    await kv.set(rateKey, newCount);
    await kv.expire(rateKey, RATE_WINDOW);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[BLITZ] Error:', err.message);
    return res.status(500).json({ error: 'Interner Fehler' });
  }
}
