const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = req.body || {};
  const name = String(body.name || "—");
  const phone = String(body.phone || "—");
  const email = String(body.email || "—");
  const scenario = String(body.scenario || "—");

  // 1. Пишемо в Supabase
  let dbError = null;
  if (SUPABASE_URL && SERVICE_KEY) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ name, phone, email, scenario }),
      });
      if (!r.ok) {
        dbError = await r.text();
      }
    } catch (err) {
      dbError = String(err);
    }
  } else {
    dbError = "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY не налаштовано";
  }

  // 2. Шлемо в Telegram
  let tgError = null;
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  if (BOT_TOKEN && CHAT_ID) {
    try {
      const text =
        "🔔 Нова заявка з LTV Pulse\n\n" +
        "Ім'я: " + name + "\n" +
        "Телефон/Telegram: " + phone + "\n" +
        "Email: " + email + "\n" +
        "Ситуація: " + scenario;

      const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: CHAT_ID, text }),
      });
      const tgData = await tgRes.json();
      if (!tgData.ok) tgError = JSON.stringify(tgData);
    } catch (err) {
      tgError = String(err);
    }
  } else {
    tgError = "TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID не налаштовано";
  }

  res.status(200).json({ ok: true, dbError, tgError });
}
