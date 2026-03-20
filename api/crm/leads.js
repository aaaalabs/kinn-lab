import { kv } from '../../lib/redis-typed.js';
import { Redis } from '@upstash/redis';

const LUMA_API_KEY = process.env.LUMA_API_KEY;
const LUMA_BASE = 'https://public-api.luma.com/v1';

// Direct Redis for reading KINN CRM data (no lab: prefix)
const redis = new Redis({
  url: process.env.KINNST_KV_REST_API_URL,
  token: process.env.KINNST_KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  if (req.method === 'GET') return handleGet(req, res);
  if (req.method === 'POST') return handlePost(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
}

// GET /api/crm/leads?event_id=xxx
async function handleGet(req, res) {
  const eventId = req.query.event_id;
  if (!eventId) return res.status(400).json({ error: 'event_id required' });
  if (!LUMA_API_KEY) return res.status(500).json({ error: 'LUMA_API_KEY not configured' });

  try {
    // Load guests directly from Luma API (no internal fetch)
    const allEntries = [];
    let cursor = null;
    let hasMore = true;

    while (hasMore) {
      const params = new URLSearchParams({ event_id: eventId, pagination_limit: '100' });
      if (cursor) params.set('pagination_cursor', cursor);

      const resp = await fetch(`${LUMA_BASE}/event/get-guests?${params}`, {
        headers: { 'x-luma-api-key': LUMA_API_KEY },
      });
      if (!resp.ok) {
        const body = await resp.text();
        return res.status(resp.status).json({ error: 'Luma API error', body });
      }

      const data = await resp.json();
      allEntries.push(...(data.entries || []));
      hasMore = data.has_more;
      cursor = data.next_cursor;
    }

    const guests = allEntries.map(entry => {
      const g = entry.guest || entry;
      const answers = g.registration_answers || [];
      return {
        id: g.api_id || '',
        name: g.user_name || '',
        firstName: g.user_first_name || '',
        lastName: g.user_last_name || '',
        email: g.user_email || '',
        status: g.approval_status || '',
        checkedIn: g.checked_in_at || '',
        motiv: findAnswer(answers, 'suche'),
        mitbringsel: findAnswer(answers, 'mitbringsel'),
        createdAt: g.created_at || '',
        lumaRating: g.survey_response_rating ?? null,
        lumaFeedback: g.survey_response_feedback ?? '',
      };
    });

    // Merge with CRM state: check lab: state first, then KINN CRM data
    const crmState = (await kv.get(`crm:${eventId}:state`)) || {};

    // Try to load existing KINN CRM leads for this specific event
    const kinnCrmLeads = await loadKinnCrmLeads(req.query.kinn_nr);

    const leads = guests.map(g => {
      // Priority: lab CRM state > KINN CRM state > default
      if (crmState[g.id]) return { ...g, followUp: crmState[g.id] };

      const kinnLead = kinnCrmLeads.get((g.email || '').toLowerCase());
      if (kinnLead?.follow_up) {
        return { ...g, followUp: {
          status: kinnLead.follow_up.follow_up_status || 'offen',
          notizen: kinnLead.follow_up.notizen || '',
        }};
      }

      return { ...g, followUp: { status: 'offen', notizen: '' } };
    });

    // Load event feedback from lab:events:* and merge by email
    const eventFeedbackMap = await loadEventFeedback(req.query.kinn_nr);
    leads.forEach(l => {
      const email = (l.email || '').toLowerCase().trim();
      if (email && eventFeedbackMap.has(email)) {
        const fb = eventFeedbackMap.get(email);
        l.lumaRating = fb.rating;
        l.lumaFeedback = fb.text;
      }
    });

    // Also return unmatched feedback as event-level list
    const allFeedback = [...eventFeedbackMap.values()];

    return res.status(200).json({ leads, total: leads.length, eventFeedback: allFeedback });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// POST /api/crm/leads
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

// Load KINN CRM leads for a specific event (e.g. kinnNr = "KINN17")
async function loadKinnCrmLeads(kinnNr) {
  const map = new Map();
  if (!kinnNr) return map;
  try {
    // Try common key formats: KINN17, KINN#17
    const keys = [kinnNr, kinnNr.replace('#', '')];
    for (const key of keys) {
      const leads = await redis.get(`crm:event:${key}:leads`);
      if (!Array.isArray(leads)) continue;
      leads.forEach(l => {
        const email = (l._email || '').toLowerCase().trim();
        if (email && l.follow_up) map.set(email, l);
      });
      break; // Found data, stop trying
    }
  } catch (e) {
    // Silently fail — KINN CRM data is optional enrichment
  }
  return map;
}

// Load event feedback from lab:events:{id}, return Map<email, feedback>
async function loadEventFeedback(kinnNr) {
  const map = new Map();
  if (!kinnNr) return map;
  try {
    const index = await kv.get('events:index');
    if (!index) return map;
    const nr = kinnNr.replace('#', '').replace(/^KINN/i, '');
    for (const entry of index) {
      const event = await kv.get(`events:${entry.id}`);
      if (!event?.name) continue;
      if (event.name.includes(`#${nr}`) || event.name.includes(`KINN${nr}`)) {
        (event.feedback || [])
          .filter(f => f.approved !== false)
          .forEach(f => {
            const email = (f.email || '').toLowerCase().trim();
            const item = {
              firstName: f.firstName || '',
              lastInitial: f.lastInitial || '',
              email,
              text: f.text || '',
              rating: f.rating ?? null,
            };
            if (email) map.set(email, item);
          });
        break;
      }
    }
  } catch (e) {
    // Silently fail
  }
  return map;
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
