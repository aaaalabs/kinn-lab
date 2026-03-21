import kv from '../../lib/redis-typed.js';

export default async function handler(req, res) {
  const { event_id } = req.query;
  if (!event_id) return res.status(400).json({ error: 'event_id required' });

  const key = `capacity:${event_id}`;

  // GET: Load capacity config
  if (req.method === 'GET') {
    const data = await kv.get(key);
    return res.status(200).json(data || null);
  }

  // POST: Save capacity config
  if (req.method === 'POST') {
    const { earlyBird, restplaetze } = req.body;
    if (typeof earlyBird !== 'number' || earlyBird < 1) {
      return res.status(400).json({ error: 'earlyBird must be a positive number' });
    }
    const rest = typeof restplaetze === 'number' ? restplaetze : Math.ceil(earlyBird * 0.15);
    const maxCapacity = earlyBird + rest;
    const overbook = Math.ceil(maxCapacity * 0.20);

    const config = {
      earlyBird,
      restplaetze: rest,
      maxCapacity,
      overbook,
      absolutMax: maxCapacity + overbook,
      updatedAt: new Date().toISOString(),
    };
    await kv.set(key, config);
    return res.status(200).json(config);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
