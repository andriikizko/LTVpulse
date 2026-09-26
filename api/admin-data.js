import { checkAdminPassword } from "./_lib/auth.js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  const password = req.query.password || req.headers["x-admin-password"];

  const ok = await checkAdminPassword(password);
  if (!ok) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (!SUPABASE_URL || !SERVICE_KEY) {
    res.status(500).json({ error: "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY не налаштовано на сервері" });
    return;
  }

  try {
    const headers = {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    };

    const [leadsRes, eventsRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/leads?select=*&order=created_at.desc&limit=500`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/analytics_events?select=*&order=created_at.desc&limit=200`, { headers }),
    ]);

    const leadsRaw = await leadsRes.json();
    const eventsRaw = await eventsRes.json();

    if (!leadsRes.ok) {
      res.status(502).json({ error: "Помилка читання leads", details: leadsRaw });
      return;
    }

    // Приводимо до формату {created_at, data:{...}} як очікує admin.html
    const leads = leadsRaw.map((l) => ({
      id: l.id,
      created_at: l.created_at,
      data: { name: l.name, phone: l.phone, email: l.email, scenario: l.scenario, status: l.status, notes: l.notes, visitor_id: l.visitor_id },
    }));
    const events = eventsRaw.map((e) => ({
      created_at: e.created_at,
      data: { event: e.event, detail: e.detail, visitor_id: e.visitor_id, utm_source: e.utm_source, utm_medium: e.utm_medium, utm_campaign: e.utm_campaign, referrer: e.referrer, page: e.page },
    }));

    res.status(200).json({ leads, events });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
