import kv from '../../lib/redis-typed.js';

const raw = kv.raw();

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const eventKeys = await raw.zrange('kinn:events', 0, '+inf', { byScore: true });
    if (!eventKeys?.length) return res.status(200).json({ events: [] });

    const { key } = req.query;

    // Single event: full feedback detail
    if (key) {
      const fullKey = `kinn:event:${key}`;
      const event = await raw.hgetall(fullKey);
      if (!event) return res.status(404).json({ error: 'Event not found' });

      const feedbackRaw = await raw.get(`${fullKey}:feedback`);
      const feedback = feedbackRaw
        ? (typeof feedbackRaw === 'string' ? JSON.parse(feedbackRaw) : feedbackRaw)
        : [];

      const answered = feedback.length;
      const checkedIn = event.checkedIn ? Number(event.checkedIn) : null;
      const contactCount = feedback.filter(f => f.contactMade === true).length;

      return res.status(200).json({
        event: {
          key,
          name: event.name,
          date: event.date,
          feedbackOpen: event.feedbackOpen === true || event.feedbackOpen === 'true',
          avgRating: event.avgRating ? Number(event.avgRating) : null,
          totalFeedback: answered,
          checkedIn,
          responseRate: checkedIn > 0 ? Math.round(answered / checkedIn * 100) : null,
          contactRate: answered > 0 ? Math.round(contactCount / answered * 100) : null,
        },
        feedback: feedback.map(f => ({
          firstName: f.firstName,
          lastInitial: f.lastInitial || '',
          valueRating: f.valueRating != null ? Number(f.valueRating) : null,
          contactMade: f.contactMade === true,
          valueText: f.valueText || '',
          missingText: f.missingText || '',
          submittedAt: f.submittedAt || null,
        })),
      });
    }

    // All events summary
    const events = [];
    for (const fullKey of eventKeys) {
      const event = await raw.hgetall(fullKey);
      if (!event) continue;
      events.push({
        key: fullKey.replace('kinn:event:', ''),
        name: event.name,
        date: event.date,
        type: event.type,
        feedbackOpen: event.feedbackOpen === true || event.feedbackOpen === 'true',
        avgRating: event.avgRating ? Number(event.avgRating) : null,
        totalFeedback: Number(event.totalFeedback || 0),
        checkedIn: event.checkedIn ? Number(event.checkedIn) : null,
      });
    }

    // Most recent first
    events.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120');
    return res.status(200).json({ events });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
