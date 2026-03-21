import kv from '../../lib/redis-typed.js';

// Redact phone numbers, emails, URLs, company names from feedback text
function redactPII(text) {
  if (!text) return text;
  // Phone numbers (+43664..., 0664..., etc.)
  text = text.replace(/\+?\d[\d\s\-\/]{7,}/g, '[...]');
  // Email addresses
  text = text.replace(/[\w.\-+]+@[\w.\-]+\.\w+/g, '[...]');
  // URLs
  text = text.replace(/https?:\/\/\S+/gi, '[...]');
  text = text.replace(/www\.\S+/gi, '[...]');
  // Company suffixes + preceding name (e.g. "Alerto GmbH", "CargoWays Marketing")
  text = text.replace(/\S+\s+(?:GmbH|AG|FlexCo|OG|KG|e\.U\.|UG)\b/gi, '[...]');
  // Clean up multiple [...] in a row
  text = text.replace(/(\[\.\.\.\][,\s]*){2,}/g, '[...]');
  return text;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const index = await kv.get('events:index');
    if (!index) return res.status(200).json({ events: [] });

    // If specific event requested
    const { id } = req.query;
    if (id) {
      const event = await kv.get(`events:${id}`);
      if (!event) return res.status(404).json({ error: 'Event not found' });
      // Filter to approved feedback only
      if (event.feedback) {
        event.feedback = event.feedback.filter(f => f.approved !== false);
      }
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
      return res.status(200).json(event);
    }

    // Fetch all events in one Redis call
    const keys = index.map(entry => `events:${entry.id}`);
    const allEvents = await kv.mget(...keys);
    const events = allEvents.filter(Boolean).map(event => ({
      id: event.id,
      lumaId: event.lumaId,
      name: event.name,
      date: event.date,
      location: event.location,
      url: event.url,
      coverUrl: event.coverUrl,
      tags: event.tags,
      groupPhoto: event.groupPhoto || null,
      stats: event.stats,
      feedback: (event.feedback || [])
        .filter(f => f.approved !== false && f.text)
        .map(f => ({
          firstName: f.firstName,
          lastInitial: f.lastInitial || '',
          text: redactPII(f.text),
        })),
    }));

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({ events, total: events.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
