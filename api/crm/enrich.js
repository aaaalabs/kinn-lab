/**
 * Enrich CRM leads with donation + survey data from shared Redis.
 * Reads KINN keys directly (no lab: prefix) since it's the same Upstash DB.
 *
 * GET /api/crm/enrich → { donations: { email: totalEur }, feedback: { email: { nps, summary } } }
 * Cached in Redis (lab:crm:enrich) for 30 min.
 */

import { Redis } from '@upstash/redis';
import { kv } from '../../lib/redis-typed.js';

const redis = new Redis({
  url: process.env.KINNST_KV_REST_API_URL,
  token: process.env.KINNST_KV_REST_API_TOKEN,
});

const CACHE_KEY = 'crm:enrich';
const CACHE_TTL = 1800;

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const cached = await kv.get(CACHE_KEY);
    if (cached) {
      res.setHeader('Cache-Control', 's-maxage=300');
      return res.status(200).json(cached);
    }

    const [donations, feedback] = await Promise.all([
      loadDonations(),
      loadFeedback(),
    ]);

    const result = { donations, feedback, cachedAt: new Date().toISOString() };
    await kv.set(CACHE_KEY, result);
    await kv.expire(CACHE_KEY, CACHE_TTL);

    res.setHeader('Cache-Control', 's-maxage=300');
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function loadDonations() {
  const donations = {};
  const counter = await redis.get('fund:tx:counter');
  if (!counter) return donations;

  // Fetch in batches of 20
  for (let i = 1; i <= counter; i += 20) {
    const keys = [];
    for (let j = i; j < i + 20 && j <= counter; j++) {
      keys.push(`fund:tx:KINN-${String(j).padStart(4, '0')}`);
    }
    const txs = await redis.mget(...keys);
    txs.forEach(tx => {
      if (!tx || !tx.email) return;
      const email = tx.email.toLowerCase().trim();
      donations[email] = (donations[email] || 0) + (tx.amount || 0);
    });
  }
  return donations;
}

async function loadFeedback() {
  const feedback = {};
  const raw = await redis.lrange('survey:transcripts', 0, -1);
  if (!raw) return feedback;

  raw.forEach(entry => {
    const t = typeof entry === 'string' ? JSON.parse(entry) : entry;
    if (!t || !t.email) return;
    const email = t.email.toLowerCase().trim();
    // Keep latest feedback per email
    feedback[email] = {
      nps: t.answers?.nps ?? null,
      summary: t.summary || null,
      role: t.answers?.role || null,
      bestMoment: t.answers?.best_moment || null,
      valueMissing: t.answers?.value_missing || null,
      submittedAt: t.submitted_at || null,
    };
  });
  return feedback;
}
