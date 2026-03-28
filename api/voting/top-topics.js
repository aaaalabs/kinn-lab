/**
 * Public endpoint: Top voted topics from kinn.at voting system
 * GET /api/voting/top-topics?limit=4
 *
 * Reads directly from shared Upstash DB (voting:topics).
 * No lab: prefix — this is KINN main repo data, not lab-scoped.
 * No auth required (public read for ops toolkit).
 */

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KINNST_KV_REST_API_URL,
  token: process.env.KINNST_KV_REST_API_TOKEN
});

const TOPICS_KEY = 'voting:topics';

function flattenTopics(data) {
  const topics = [];

  function extract(obj, level = 0) {
    if (level > 10 || !obj) return;
    if (Array.isArray(obj)) {
      obj.forEach(item => extract(item, level + 1));
      return;
    }
    if (typeof obj === 'object') {
      if (obj.id && obj.title && typeof obj.votes === 'number') {
        topics.push(obj);
        return;
      }
      Object.values(obj).forEach(value => extract(value, level + 1));
    }
  }

  extract(data);
  return topics;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const limit = Math.min(parseInt(req.query.limit) || 4, 20);

  try {
    const rawData = await redis.json.get(TOPICS_KEY, '$');
    const data = rawData?.[0] || rawData || [];
    const topics = flattenTopics(data);

    topics.sort((a, b) => b.votes - a.votes);

    const result = topics.slice(0, limit).map(({ voterEmails, authorEmail, ...rest }) => rest);

    return res.status(200).json({ topics: result });
  } catch (error) {
    if (error.message?.includes('not found')) {
      return res.status(200).json({ topics: [] });
    }
    console.error('[TOP-TOPICS] Error:', error);
    return res.status(500).json({ error: 'Failed to fetch topics' });
  }
}
