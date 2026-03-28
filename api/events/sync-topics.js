import kv from '../../lib/redis-typed.js';

const LUMA_API_KEY = process.env.LUMA_API_KEY;
const CRON_SECRET = process.env.CRON_SECRET;
const LUMA_BASE = 'https://public-api.luma.com/v1';
const TOPIC_KEYWORD = 'themen';

const raw = kv.raw();

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Auth: Vercel Cron header or secret
  const authHeader = req.headers['authorization'];
  const cronHeader = req.headers['x-vercel-cron'];
  if (!cronHeader && authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!LUMA_API_KEY) return res.status(500).json({ error: 'LUMA_API_KEY not configured' });

  try {
    // Load all future chapter events
    const today = new Date().toISOString().split('T')[0];
    const eventKeys = await raw.zrange('kinn:events', 0, '+inf', { byScore: true });
    if (!eventKeys?.length) return res.status(200).json({ synced: 0 });

    const allEvents = await Promise.all(eventKeys.map(k => raw.hgetall(k)));
    const chapters = [];
    for (let i = 0; i < eventKeys.length; i++) {
      const ev = allEvents[i];
      if (!ev?.date || ev.date < today) continue;
      if ((ev.type || 'chapter') !== 'chapter') continue;
      if (!ev.lumaId) continue;
      chapters.push({ key: eventKeys[i], lumaId: ev.lumaId });
    }

    if (!chapters.length) return res.status(200).json({ synced: 0 });

    // Fetch guests for each chapter and extract topic votes
    const results = [];
    for (const ch of chapters) {
      const topics = await fetchTopicsForEvent(ch.lumaId);
      if (topics) {
        await raw.set(`${ch.key}:topics`, JSON.stringify(topics));
        results.push({ key: ch.key, topics });
      }
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ synced: results.length, results });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function fetchTopicsForEvent(lumaEventId) {
  const allEntries = [];
  let cursor = null;
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams({
      event_id: lumaEventId,
      pagination_limit: '100',
    });
    if (cursor) params.set('pagination_cursor', cursor);

    const resp = await fetch(`${LUMA_BASE}/event/get-guests?${params}`, {
      headers: { 'x-luma-api-key': LUMA_API_KEY },
    });
    if (!resp.ok) return null;

    const data = await resp.json();
    allEntries.push(...(data.entries || []));
    hasMore = data.has_more;
    cursor = data.next_cursor;
  }

  // Count topic selections across all approved guests
  const counts = {};
  for (const entry of allEntries) {
    const g = entry.guest || entry;
    if (g.approval_status !== 'approved') continue;

    const answer = findAnswer(g.registration_answers || [], TOPIC_KEYWORD);
    if (!answer) continue;

    // Topics can be comma-separated or array
    const selected = Array.isArray(answer) ? answer : answer.split(',').map(s => s.trim());
    for (const topic of selected) {
      if (topic) counts[topic] = (counts[topic] || 0) + 1;
    }
  }

  return Object.keys(counts).length ? counts : null;
}

function findAnswer(answers, keyword) {
  if (Array.isArray(answers)) {
    const match = answers.find(a =>
      (a.question_label || a.label || '').toLowerCase().includes(keyword)
    );
    return match ? (match.answer || match.value || '') : '';
  }
  if (answers && typeof answers === 'object') {
    for (const [key, val] of Object.entries(answers)) {
      if (key.toLowerCase().includes(keyword)) return val || '';
    }
  }
  return '';
}
