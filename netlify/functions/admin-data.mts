import type { Context, Config } from "@netlify/functions";

// v2 — force rebuild after env vars were added
const SITE_ID = "f810996f-f560-4327-8eb9-fa95767727d8";

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const password = url.searchParams.get("password") || req.headers.get("x-admin-password");

  const ADMIN_PASSWORD = Netlify.env.get("ADMIN_PASSWORD");
  const TOKEN = Netlify.env.get("NETLIFY_API_TOKEN");

  if (!ADMIN_PASSWORD) {
    return new Response(JSON.stringify({
      error: "ADMIN_PASSWORD не налаштовано на сервері",
      debug: { hasToken: !!TOKEN, hasPassword: !!ADMIN_PASSWORD }
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!password || password !== ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!TOKEN) {
    return new Response(JSON.stringify({ error: "NETLIFY_API_TOKEN не налаштовано на сервері" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const formsRes = await fetch(`https://api.netlify.com/api/v1/sites/${SITE_ID}/forms`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const forms = await formsRes.json();

    if (!Array.isArray(forms)) {
      return new Response(JSON.stringify({ error: "Не вдалося отримати форми", details: forms }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const leadForm = forms.find((f: any) => f.name === "lead");
    const analyticsForm = forms.find((f: any) => f.name === "analytics");

    let leads: any[] = [];
    let events: any[] = [];

    if (leadForm) {
      const r = await fetch(`https://api.netlify.com/api/v1/forms/${leadForm.id}/submissions`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
      });
      leads = await r.json();
    }
    if (analyticsForm) {
      const r = await fetch(`https://api.netlify.com/api/v1/forms/${analyticsForm.id}/submissions`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
      });
      events = await r.json();
    }

    return new Response(JSON.stringify({ leads, events }), {
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
  path: "/api/admin-data",
};
