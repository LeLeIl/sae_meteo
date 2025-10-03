async function fetchLatest() {
  try {
    const r = await fetch('/.netlify/functions/latest?ts=' + Date.now(), { cache: 'no-store' });
    const json = await r.json(); // { temperature, humidity, timeISO }
    document.getElementById('temp').textContent =
      (typeof json.temperature === 'number') ? json.temperature.toString() : '--';
    document.getElementById('hum').textContent =
      (typeof json.humidity === 'number') ? json.humidity.toString() : '--';
    document.getElementById('time').textContent =
      json.timeISO ? new Date(json.timeISO).toLocaleString() : '--';
  } catch (e) {
    document.getElementById('temp').textContent = '--';
    document.getElementById('hum').textContent = '--';
    document.getElementById('time').textContent = 'Error';
  }
}
document.getElementById('refresh').addEventListener('click', fetchLatest);
fetchLatest();
setInterval(fetchLatest, 5000);
