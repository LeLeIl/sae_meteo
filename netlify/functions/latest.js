// --- Cache simple en memoria del servidor Netlify ---
let LAST = null;      // {temperature, humidity, timeISO}
let LAST_TS = 0;      // timestamp en ms
const CACHE_MS = 10000; // 10 s mínimo entre llamadas reales a TTN
export async function handler() {
  try {
    // Si tenemos datos recientes, devolverlos sin consultar TTN
    if (LAST && (Date.now() - LAST_TS) < CACHE_MS) {
      return {
        statusCode: 200,
        headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
        body: JSON.stringify(LAST),
      };
    }
    const BASE = process.env.TTS_BASE || 'https://eu1.cloud.thethings.network';
    const APP  = process.env.TTS_APP;
    const KEY  = process.env.TTS_KEY; // token completo (empieza por NNSXS.)
    if (!APP || !KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing TTS_APP or TTS_KEY env var' }) };
    }
    // Consulta al almacenamiento (último uplink)
    const url = `${BASE}/api/v3/applications/${encodeURIComponent(APP)}/packages/storage/uplink_message?limit=1`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${KEY}`, Accept: 'application/json' }
    });
    if (!res.ok) {
      const text = await res.text();
      return { statusCode: res.status, body: JSON.stringify({ error: `TTS ${res.status}`, details: text }) };
    }
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data?.result ? data.result : data);
    const last = list?.[0] ?? list?.result?.[0] ?? list;
    // Puede venir en distintas rutas según versión
    const up   = last?.result?.uplink_message || last?.uplink_message || last;
    const dec  = up?.decoded_payload || up?.payload?.fields || {};
    let temperature = (typeof dec.temperature === 'number') ? dec.temperature : null;
    let humidity    = (typeof dec.humidity    === 'number') ? dec.humidity    : null;
    const timeISO   = up?.received_at || last?.received_at || new Date().toISOString();
    // Guarda en caché y responde
    LAST = { temperature, humidity, timeISO };
    LAST_TS = Date.now();
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
      body: JSON.stringify(LAST),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
