import { kv } from '../../lib/redis-typed.js';

export default async function handler(req, res) {
  if (req.method === 'GET') return handleGet(req, res);
  if (req.method === 'POST') return handlePost(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
}

// GET /api/crm/leads?event_id=xxx — Load guests from Luma + merge CRM state from Redis
async function handleGet(req, res) {
  const eventId = req.query.event_id;
  if (!eventId) return res.status(400).json({ error: 'event_id required' });

  try {
    // Load guests from Luma
    const lumaRes = await fetch(
      `https://${req.headers.host}/api/luma/guests?event_id=${encodeURIComponent(eventId)}`
    );
    if (!lumaRes.ok) {
      return res.status(lumaRes.status).json({ error: 'Luma guests error' });
    }
    const { guests } = await lumaRes.json();

    // Load CRM state from Redis
    const crmState = (await kv.get(`crm:${eventId}:state`)) || {};

    // Merge: Luma data + CRM follow-up state
    const leads = guests.map(g => ({
      ...g,
      followUp: crmState[g.id] || { status: 'offen', notizen: '' },
    }));

    return res.status(200).json({ leads, total: leads.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// POST /api/crm/leads — Update follow-up status for a guest
async function handlePost(req, res) {
  const { event_id, guest_id, status, notizen } = req.body || {};
  if (!event_id || !guest_id) {
    return res.status(400).json({ error: 'event_id and guest_id required' });
  }

  const validStatuses = ['offen', 'kontaktiert', 'erledigt'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Ungültiger Status' });
  }

  try {
    const crmState = (await kv.get(`crm:${event_id}:state`)) || {};
    const current = crmState[guest_id] || { status: 'offen', notizen: '' };

    if (status) current.status = status;
    if (notizen !== undefined) current.notizen = notizen;
    current.updatedAt = new Date().toISOString();

    crmState[guest_id] = current;
    await kv.set(`crm:${event_id}:state`, crmState);

    return res.status(200).json({ success: true, followUp: current });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
