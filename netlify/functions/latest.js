export async function handler() {
  try {
    const BASE = process.env.TTS_BASE || 'https://eu1.cloud.thethings.network';
    const APP  = process.env.TTS_APP;   // p.ej. 'sma'
    const KEY  = process.env.TTS_KEY;   // API key con permisos de storage/read
    if (!APP || !KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing TTS_APP or TTS_KEY env var' }) };
    }
    // Último uplink almacenado en Message Storage
    // Ordenamos por fecha descendente y limitamos a 1
    const url = `${BASE}/api/v3/as/applications/${encodeURIComponent(APP)}` +
                `/packages/storage/uplink_message?order=received_at%20desc&limit=1`;
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
    // Tolerar variantes: a veces viene {result:[...]} o directamente array
    const list = Array.isArray(data) ? data : (data?.result ? data.result : data);
    const last = list?.[0];
    if (!last) {
      return { statusCode: 200, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
               body: JSON.stringify({ temperature: null, humidity: null, timeISO: null }) };
    }
    // Puede venir como decoded_payload o payload.fields
    const up  = last.uplink_message || last;
    const dec = up?.decoded_payload || up?.payload?.fields || {};
    // Leemos tal como envía el decoder (enteros)
    const temperature = (typeof dec.temperature === 'number') ? dec.temperature : null;
    const humidity    = (typeof dec.humidity === 'number')    ? dec.humidity    : null;
    const timeISO = up?.received_at || last?.received_at || new Date().toISOString();
    return {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store, no-cache, must-revalidate, max-age=0'
      },
      body: JSON.stringify({ temperature, humidity, timeISO })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}

