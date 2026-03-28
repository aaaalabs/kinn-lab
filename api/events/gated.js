import kv from '../../lib/redis-typed.js';

const raw = kv.raw();

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const email = (req.query.email || '').toLowerCase().trim();

    // Verify user if email provided
    let verified = false;
    if (email) {
      const cached = await kv.get('attendance:counts');
      const counts = cached?.counts || {};
      const attended = (counts[email] || 0) >= 1;
      const whitelisted = await raw.sismember('kinn:verified:whitelist', email);
      verified = attended || whitelisted;
    }

    // Load all events from sorted set
    const eventKeys = await raw.zrange('kinn:events', 0, '+inf', { byScore: true });
    if (!eventKeys?.length) {
      return res.status(200).json({ hero: null, events: [], verified });
    }

    const today = new Date().toISOString().split('T')[0];
    let hero = null;
    const events = [];

    for (const fullKey of eventKeys) {
      const ev = await raw.hgetall(fullKey);
      if (!ev || !ev.date) continue;
      if (ev.date < today) continue;

      const key = fullKey.replace('kinn:event:', '');
      const type = ev.type || 'chapter';
      const isGated = type === 'talk' || type === 'kurs';
      const locked = isGated && !verified;

      const lumaId = ev.lumaId || null;

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
        lumaId: locked ? null : lumaId,
        coverUrl: ev.coverUrl || null,
        locked,
      };

      if (type === 'chapter' && !hero) {
        hero = item;
      } else if (type === 'chapter') {
        events.push({ ...item, locked: false });
      } else if (isGated) {
        events.push(item);
      }
    }

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
