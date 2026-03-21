import kv from '../../lib/redis-typed.js';

const raw = kv.raw();

async function findEventKey(eventId) {
  // Direct kinn:event: key
  if (eventId.startsWith('kinn:event:')) return eventId;

  // Luma ID — scan for match
  const keys = await raw.zrange('kinn:events', 0, '+inf', { byScore: true });
  for (const key of keys) {
    const lumaId = await raw.hget(key, 'lumaId');
    if (lumaId === eventId) return key;
  }
  return null;
}

export default async function handler(req, res) {
  const { event_id } = req.query;
  if (!event_id) return res.status(400).json({ error: 'event_id required' });

  const key = await findEventKey(event_id);

  if (req.method === 'GET') {
    if (!key) return res.status(200).json(null);
    const data = await raw.hgetall(key);
    if (!data?.earlyBird) return res.status(200).json(null);
    return res.status(200).json({
      earlyBird: Number(data.earlyBird),
      restplaetze: Number(data.restplaetze || 0),
      maxCapacity: Number(data.maxCapacity || 0),
      absolutMax: Number(data.absolutMax || 0),
    });
  }

  if (req.method === 'POST') {
    if (!key) return res.status(404).json({ error: 'Event not found' });
    const { earlyBird, restplaetze } = req.body;
    if (typeof earlyBird !== 'number' || earlyBird < 1) {
      return res.status(400).json({ error: 'earlyBird must be a positive number' });
    }
    const rest = typeof restplaetze === 'number' ? restplaetze : Math.ceil(earlyBird * 0.15);
    const maxCapacity = earlyBird + rest;
    const absolutMax = maxCapacity + Math.ceil(maxCapacity * 0.20);

    await raw.hset(key, {
      earlyBird: String(earlyBird),
      restplaetze: String(rest),
      maxCapacity: String(maxCapacity),
      absolutMax: String(absolutMax),
      updatedAt: new Date().toISOString(),
    });

    return res.status(200).json({ earlyBird, restplaetze: rest, maxCapacity, absolutMax });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
