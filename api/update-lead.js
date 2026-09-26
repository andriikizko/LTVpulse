const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const body = req.body || {};
  const password = body.password;

  if (!ADMIN_PASSWORD || !password || password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (!SUPABASE_URL || !SERVICE_KEY) {
    res.status(500).json({ error: "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY не налаштовано" });
    return;
  }

  const id = body.id;
  if (!id) {
    res.status(400).json({ error: "Не вказано id заявки" });
    return;
  }

  const patch = {};
  if (typeof body.status === "string") patch.status = body.status;
  if (typeof body.notes === "string") patch.notes = body.notes;

  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(patch),
    });
    if (!r.ok) {
      const t = await r.text();
      res.status(502).json({ error: "Помилка оновлення", details: t });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
