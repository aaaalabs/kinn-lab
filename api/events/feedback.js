import kv from '../../lib/redis-typed.js';

const raw = kv.raw();

function redactPII(text) {
  if (!text) return text;
  text = text.replace(/\+?\d[\d\s\-\/]{7,}/g, '[...]');
  text = text.replace(/[\w.\-+]+@[\w.\-]+\.\w+/g, '[...]');
  text = text.replace(/https?:\/\/\S+/gi, '[...]');
  text = text.replace(/www\.\S+/gi, '[...]');
  text = text.replace(/\S+\s+(?:GmbH|AG|FlexCo|OG|KG|e\.U\.|UG)\b/gi, '[...]');
  text = text.replace(/(\[\.\.\.\][,\s]*){2,}/g, '[...]');
  return text;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Get all event keys from sorted set
    const eventKeys = await raw.zrange('kinn:events', 0, '+inf', { byScore: true });
    if (!eventKeys || !eventKeys.length) return res.status(200).json({ events: [] });

    // If specific event requested by key slug (e.g. "17" or "kufstein:17")
    const { id } = req.query;
    if (id) {
      const key = `kinn:event:${id}`;
      const event = await raw.hgetall(key);
      if (!event) return res.status(404).json({ error: 'Event not found' });
      const feedbackRaw = await raw.get(`${key}:feedback`);
      const feedback = feedbackRaw ? (typeof feedbackRaw === 'string' ? JSON.parse(feedbackRaw) : feedbackRaw) : [];
      event.feedback = feedback.filter(f => f.approved !== false);
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
      return res.status(200).json(event);
    }

    // Load all events + feedback
    const events = [];
    for (const key of eventKeys) {
      const event = await raw.hgetall(key);
      if (!event) continue;

      // Load feedback texts
      const feedbackRaw = await raw.get(`${key}:feedback`);
      const feedback = feedbackRaw ? (typeof feedbackRaw === 'string' ? JSON.parse(feedbackRaw) : feedbackRaw) : [];

      events.push({
        key: key.replace('kinn:event:', ''),
        lumaId: event.lumaId || null,
        name: event.name,
        date: event.date,
        type: event.type,
        chapter: event.chapter || null,
        location: {
          name: event.location || '',
          city: event.locationCity || '',
          fullAddress: event.locationAddress || '',
        },
        url: event.lumaUrl || null,
        coverUrl: event.coverUrl || null,
        groupPhoto: event.groupPhoto || null,
        stats: {
          registered: event.registered ? Number(event.registered) : null,
          checkedIn: event.checkedIn ? Number(event.checkedIn) : null,
          attendeesVerified: event.attendeesVerified === true || event.attendeesVerified === 'true',
          avgRating: event.avgRating ? Number(event.avgRating) : null,
          totalRatings: Number(event.totalRatings || 0),
          totalFeedback: Number(event.totalFeedback || 0),
        },
        feedback: feedback
          .filter(f => f.approved !== false && (f.valueText || f.text))
          .map(f => ({
            firstName: f.firstName,
            lastInitial: f.lastInitial || '',
            text: redactPII(f.valueText || f.text || ''),
          })),
      });
    }

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({ events, total: events.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
