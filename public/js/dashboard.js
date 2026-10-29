// Halaman dashboard: kartu ringkasan + grafik Chart.js
function renderCards(stats) {
  document.getElementById('statBaru').textContent = stats.baru;
  document.getElementById('statDiproses').textContent = stats.diproses;
  document.getElementById('statSelesai').textContent = stats.selesai;
  document.getElementById('statHariIni').textContent = stats.hariIni;
  document.getElementById('statRata').textContent = stats.rataRataJam === null ? '-' : `${stats.rataRataJam} jam`;
}

function barChart(canvasId, items, color, horizontal = false) {
  new Chart(document.getElementById(canvasId), {
    type: 'bar',
    data: {
      labels: items.map((i) => i.label),
      datasets: [{ label: 'Jumlah tiket', data: items.map((i) => i.total), backgroundColor: color }],
    },
    options: {
      indexAxis: horizontal ? 'y' : 'x',
      plugins: { legend: { display: false } },
      scales: { [horizontal ? 'x' : 'y']: { beginAtZero: true, ticks: { precision: 0 } } },
    },
  });
}

(async function initDashboard() {
  try {
    await initLayout();
    const stats = await api('/api/dashboard');
    renderCards(stats);
    barChart('chartKategori', stats.byKategori, '#0d6efd');
    barChart('chartLokasi', stats.topLokasi, '#dc3545', true);
  } catch (err) {
    if (err.message !== 'Belum login') showToast(err.message, 'danger');
  }
}());
