const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function checkAdminPassword(password) {
  if (!password) return false;
  if (!SUPABASE_URL || !SERVICE_KEY) return false;

  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/admin_access?select=id&password=eq.${encodeURIComponent(password)}`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
    );
    if (!r.ok) return false;
    const rows = await r.json();
    return Array.isArray(rows) && rows.length > 0;
  } catch {
    return false;
  }
}
