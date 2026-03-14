/**
 * Health Check Endpoint
 * GET /api/health → { status: "ok", env: "lab", timestamp }
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const health = {
    status: 'ok',
    env: 'lab',
    timestamp: new Date().toISOString(),
  };

  // Optional: Redis ping
  if (process.env.KINNST_KV_REST_API_URL) {
    try {
      const { kv } = await import('../lib/redis-typed.js');
      await kv.set('health:ping', Date.now(), { ex: 60 });
      health.redis = 'connected';
    } catch {
      health.redis = 'error';
    }
  }

  return res.status(200).json(health);
}
