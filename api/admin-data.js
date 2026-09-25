export default async function handler(req, res) {
  const password = req.query.password || req.headers["x-admin-password"];
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (!ADMIN_PASSWORD) {
    res.status(500).json({ error: "ADMIN_PASSWORD не налаштовано на сервері" });
    return;
  }

  if (!password || password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // TODO: підключити Supabase (або іншу базу) — поки що заявки й події
  // не зберігаються окремо від Telegram, тому список тут порожній.
  res.status(200).json({
    leads: [],
    events: [],
    note: "База даних ще не підключена — заявки йдуть тільки в Telegram. Підключи Supabase, щоб бачити список тут.",
  });
}
