import { checkAdminPassword } from "./_lib/auth.js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = req.body || {};
  const password = body.password;
  const action = body.action;

  const ok = await checkAdminPassword(password);
  if (!ok) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (!SUPABASE_URL || !SERVICE_KEY) {
    res.status(500).json({ error: "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY не налаштовано" });
    return;
  }

  const headers = {
    "Content-Type": "application/json",
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
  };

  try {
    if (action === "list") {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/admin_access?select=id,label,created_at&order=created_at.asc`, { headers });
      const rows = await r.json();
      res.status(200).json({ ok: true, access: rows });
      return;
    }

    if (action === "add") {
      const label = String(body.label || "").trim();
      const newPassword = String(body.newPassword || "").trim();
      if (!label || !newPassword) {
        res.status(400).json({ error: "Потрібні label і newPassword" });
        return;
      }
      const r = await fetch(`${SUPABASE_URL}/rest/v1/admin_access`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=minimal" },
        body: JSON.stringify({ label, password: newPassword }),
      });
      if (!r.ok) {
        res.status(502).json({ error: "Помилка додавання", details: await r.text() });
        return;
      }
      res.status(200).json({ ok: true });
      return;
    }

    if (action === "update") {
      const id = body.id;
      const label = body.label;
      const newPassword = body.newPassword;
      if (!id) {
        res.status(400).json({ error: "Не вказано id" });
        return;
      }
      const patch = {};
      if (typeof label === "string" && label.trim()) patch.label = label.trim();
      if (typeof newPassword === "string" && newPassword.trim()) patch.password = newPassword.trim();
      if (Object.keys(patch).length === 0) {
        res.status(400).json({ error: "Нічого оновлювати" });
        return;
      }
      const r = await fetch(`${SUPABASE_URL}/rest/v1/admin_access?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=minimal" },
        body: JSON.stringify(patch),
      });
      if (!r.ok) {
        res.status(502).json({ error: "Помилка оновлення", details: await r.text() });
        return;
      }
      res.status(200).json({ ok: true });
      return;
    }

    if (action === "delete") {
      const id = body.id;
      if (!id) {
        res.status(400).json({ error: "Не вказано id" });
        return;
      }
      // не дозволяємо видалити останній доступ
      const countRes = await fetch(`${SUPABASE_URL}/rest/v1/admin_access?select=id`, { headers });
      const all = await countRes.json();
      if (Array.isArray(all) && all.length <= 1) {
        res.status(400).json({ error: "Не можна видалити останній доступ" });
        return;
      }
      const r = await fetch(`${SUPABASE_URL}/rest/v1/admin_access?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { ...headers, Prefer: "return=minimal" },
      });
      if (!r.ok) {
        res.status(502).json({ error: "Помилка видалення", details: await r.text() });
        return;
      }
      res.status(200).json({ ok: true });
      return;
    }

    res.status(400).json({ error: "Невідома дія" });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
