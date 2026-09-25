export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    res.status(500).json({ error: "Telegram не налаштовано на сервері (перевір env vars у Vercel)" });
    return;
  }

  try {
    const body = req.body || {};
    const name = String(body.name || "—");
    const phone = String(body.phone || "—");
    const email = String(body.email || "—");
    const scenario = String(body.scenario || "—");

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

    if (!tgData.ok) {
      res.status(502).json({ error: "Telegram API error", details: tgData });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
