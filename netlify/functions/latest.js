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
    // ... arriba tu fetch y parse igual ...
const data = await res.json();
// tolerar distintos formatos
const last = Array.isArray(data) ? data[0] : (data?.result ? data.result[0] : data);
const up   = last?.result?.uplink_message || last?.uplink_message || last;
// puede venir como decoded_payload o payload.fields
const dec  = up?.decoded_payload || (up?.payload?.fields || {});

const temperature =
  (typeof dec.temperature === 'number') ? dec.temperature :
  (typeof dec.data?.temperature === 'number') ? dec.data.temperature :
  null;
const humidity =
  (typeof dec.humidity === 'number') ? dec.humidity :
  (typeof dec.data?.humidity === 'number') ? dec.data.humidity :
  null;
const timeISO = up?.received_at || last?.received_at || new Date().toISOString();
return {
  statusCode: 200,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  body: JSON.stringify({ temperature, humidity, timeISO })
};
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
