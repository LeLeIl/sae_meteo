const tempEl = document.getElementById('temp');
const ctx = document.getElementById('chart').getContext('2d');
const data = { labels: [], datasets: [{ label: 'Temperature (°C)', data: [] }] };
const chart = new Chart(ctx, { type: 'line', data, options: { animation:false, responsive:true } });
async function fetchLatest() {
  const r = await fetch('/.netlify/functions/latest', { cache: 'no-store' });
  const json = await r.json();   // { timeISO, temperature }
  if (json && typeof json.temperature === 'number') {
    tempEl.textContent = json.temperature.toFixed(1);
    data.labels.push(new Date(json.timeISO).toLocaleTimeString());
    data.datasets[0].data.push(json.temperature);
    if (data.labels.length > 100) { data.labels.shift(); data.datasets[0].data.shift(); }
    chart.update();
  }
}
setInterval(fetchLatest, 5000); // “casi tiempo real” con polling cada 5 s
fetchLatest();