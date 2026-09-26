const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (!SUPABASE_URL || !SERVICE_KEY) {
    res.status(200).json({ ok: false });
    return;
  }

  try {
    const body = req.body || {};
    const payload = {
      event: String(body.event || ""),
      detail: String(body.detail || ""),
      visitor_id: String(body.visitor_id || ""),
      utm_source: String(body.utm_source || ""),
      utm_medium: String(body.utm_medium || ""),
      utm_campaign: String(body.utm_campaign || ""),
      referrer: String(body.referrer || ""),
      page: String(body.page || ""),
    };

    await fetch(`${SUPABASE_URL}/rest/v1/analytics_events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(200).json({ ok: false, error: String(err) });
  }
}
