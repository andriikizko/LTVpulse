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
    const event = String(body.event || "");
    const detail = String(body.detail || "");

    await fetch(`${SUPABASE_URL}/rest/v1/analytics_events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ event, detail }),
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(200).json({ ok: false, error: String(err) });
  }
}
