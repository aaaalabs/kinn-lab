import kv from '../../lib/redis-typed.js';

const raw = kv.raw();

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const email = (req.query.email || '').toLowerCase().trim();

    // Verify user if email provided
    let verified = false;
    if (email) {
      // Check attendance cache (built by /api/luma/attendance)
      const cached = await kv.get('attendance:counts');
      const counts = cached?.counts || {};
      const attended = (counts[email] || 0) >= 1;

      // Check whitelist
      const whitelisted = await raw.sismember('kinn:verified:whitelist', email);

      verified = attended || whitelisted;
    }

    // Load all events from sorted set
    const eventKeys = await raw.zrange('kinn:events', 0, '+inf', { byScore: true });
    if (!eventKeys?.length) {
      return res.status(200).json({ hero: null, events: [], verified });
    }

    // Compare dates as strings (YYYY-MM-DD) to avoid timezone issues
    const today = new Date().toISOString().split('T')[0];
    let hero = null;
    const events = [];

    for (const fullKey of eventKeys) {
      const ev = await raw.hgetall(fullKey);
      if (!ev || !ev.date) continue;

      if (ev.date < today) continue; // skip past events

      const key = fullKey.replace('kinn:event:', '');
      const type = ev.type || 'chapter';
      const isGated = type === 'talk' || type === 'kurs';
      const locked = isGated && !verified;

      const item = {
        key,
        name: ev.name,
        type,
        date: ev.date,
        time: ev.time || null,
        endTime: ev.endTime || null,
        location: ev.location || '',
        locationCity: ev.locationCity || '',
        lumaUrl: locked ? null : (ev.lumaUrl || null),
        coverUrl: ev.coverUrl || null,
        locked,
      };

      // First upcoming chapter = hero, rest are additional Donnerstage (unlocked)
      if (type === 'chapter' && !hero) {
        hero = item;
      } else if (type === 'chapter') {
        events.push({ ...item, locked: false }); // additional Donnerstage always unlocked
      } else if (isGated) {
        events.push(item);
      }
    }

    // Set cache headers
    if (email) {
      res.setHeader('Cache-Control', 'private, no-store');
    } else {
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    }

    return res.status(200).json({ hero, events, verified });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
