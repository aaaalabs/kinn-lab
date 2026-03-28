import kv from '../../lib/redis-typed.js';

const raw = kv.raw();

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const email = (req.query.email || '').toLowerCase().trim();

    // Load event keys + verify user in parallel
    const [eventKeys, ...verifyResults] = await Promise.all([
      raw.zrange('kinn:events', 0, '+inf', { byScore: true }),
      ...(email ? [
        kv.get('attendance:counts'),
        raw.sismember('kinn:verified:whitelist', email),
      ] : []),
    ]);

    let verified = false;
    if (email) {
      const counts = verifyResults[0]?.counts || {};
      const attended = (counts[email] || 0) >= 1;
      verified = attended || verifyResults[1];
    }

    if (!eventKeys?.length) {
      return res.status(200).json({ hero: null, events: [], verified });
    }

    // Fetch all event hashes in parallel
    const today = new Date().toISOString().split('T')[0];
    const allEvents = await Promise.all(eventKeys.map(k => raw.hgetall(k)));

    let hero = null;
    const events = [];

    for (let i = 0; i < eventKeys.length; i++) {
      const fullKey = eventKeys[i];
      const ev = allEvents[i];
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
