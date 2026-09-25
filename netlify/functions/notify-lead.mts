import type { Context, Config } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const BOT_TOKEN = Netlify.env.get("TELEGRAM_BOT_TOKEN");
  const CHAT_ID = Netlify.env.get("TELEGRAM_CHAT_ID");

  if (!BOT_TOKEN || !CHAT_ID) {
    return new Response(JSON.stringify({ error: "Telegram не налаштовано на сервері" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const name = String(body.name || "—");
    const phone = String(body.phone || "—");
    const scenario = String(body.scenario || "—");

    const text =
      "🔔 Нова заявка з LTV Pulse\n\n" +
      "Ім'я: " + name + "\n" +
      "Телефон/Telegram: " + phone + "\n" +
      "Ситуація: " + scenario;

    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: text }),
    });

    const tgData = await tgRes.json();

    if (!tgData.ok) {
      return new Response(JSON.stringify({ error: "Telegram API error", details: tgData }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config: Config = {
  path: "/api/notify-lead",
};
