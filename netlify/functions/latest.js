export async function handler() {
  try {
    const BASE = process.env.TTS_BASE || 'https://eu1.cloud.thethings.network';
    const APP  = process.env.TTS_APP;
    const KEY  = process.env.TTS_KEY; // NNSXS_...
    if (!APP || !KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing TTS_APP or TTS_KEY env var' }) };
    }
    // Storage API: último uplink almacenado
    const url = `${BASE}/api/v3/as/applications/${encodeURIComponent(APP)}/packages/storage/uplink_message?limit=1`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${KEY}`,
        'Accept': 'application/json'
      }
    });
    if (!res.ok) {
      const text = await res.text();
      return { statusCode: res.status, body: JSON.stringify({ error: `TTS ${res.status} ${res.statusText}`, details: text }) };
    }
    const data = await res.json();
    // Tolerante a distintos formatos
    const item = Array.isArray(data) ? data[0] : (data?.result ? data.result[0] : data);
    const up   = item?.result?.uplink_message || item?.uplink_message || item;
    const dec  = up?.decoded_payload || up?.payload_fields || {};
    const temperature = (typeof dec.temperature === 'number') ? dec.temperature : null;
    const humidity    = (typeof dec.humidity    === 'number') ? dec.humidity    : null;
    const timeISO     = up?.received_at || item?.received_at || new Date().toISOString();
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
      body: JSON.stringify({ temperature, humidity, timeISO })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
