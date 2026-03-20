const LUMA_API_KEY = process.env.LUMA_API_KEY;
const LUMA_BASE = 'https://public-api.luma.com/v1';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!LUMA_API_KEY) return res.status(500).json({ error: 'LUMA_API_KEY not configured' });

  const eventId = req.query.event_id;
  if (!eventId) return res.status(400).json({ error: 'event_id required' });

  try {
    const allEntries = [];
    let cursor = null;
    let hasMore = true;

    while (hasMore) {
      const params = new URLSearchParams({
        event_id: eventId,
        pagination_limit: '100',
      });
      if (cursor) params.set('pagination_cursor', cursor);

      const resp = await fetch(`${LUMA_BASE}/event/get-guests?${params}`, {
        headers: { 'x-luma-api-key': LUMA_API_KEY },
      });

      if (!resp.ok) {
        const body = await resp.text();
        return res.status(resp.status).json({ error: 'Luma API error', status: resp.status, body });
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
        lumaRating: g.survey_response_rating ?? g.event_survey_response?.rating ?? null,
        lumaFeedback: g.survey_response_feedback ?? g.event_survey_response?.feedback ?? '',
      };
    });

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    return res.status(200).json({ guests, total: guests.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
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
