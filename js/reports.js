// reports.js - Laporan penjualan & grafik tren 7 hari terakhir

function getReportData() {
  const range = document.getElementById('filterRange').value;
  const paket = document.getElementById('filterPaket').value;
  let all = loadLocalVouchers();

  // Filter data by waktu
  let start, end, now = new Date();
  switch(range) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0,0,0,0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23,59,59,999);
      break;
    case 'yesterday':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0,0,0,0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23,59,59,999);
      break;
    case 'thisMonth':
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0,0,0,0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23,59,59,999);
      break;
    case 'lastMonth':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0,0,0,0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23,59,59,999);
      break;
    default:
      start = new Date(2000,0,1,0,0,0,0);
      end = new Date(2100,0,1,0,0,0,0);
  }

  let data = all.filter(v => {
    let t = new Date(v.timestamp || v.time);
    let ok = t >= start && t <= end;
    if (paket && v.package) ok = ok && v.package.endsWith(paket);
    return ok;
  });
  return data;
}

function renderReport() {
  let data = getReportData();
  // Rekap per paket
  let count = {'Paket1':0, 'Paket2':0, 'Paket3':0, 'Paket4':0, 'Paket5':0};
  let sum = {'Paket1':0, 'Paket2':0, 'Paket3':0, 'Paket4':0, 'Paket5':0};
  let total = 0;
  data.forEach(v => {
    let jenis = v.package || v.jenis;
    let harga = v.price || v.harga || 0;
    if (jenis && count[jenis] !== undefined) {
      count[jenis]++;
      sum[jenis] += parseInt(harga || 0);
      total += parseInt(harga || 0);
    }
  });

  // Tabel
  let html = `
    <table class="table table-sm table-bordered align-middle text-center">
      <thead>
        <tr>
          <th>Paket</th>
          <th>Terjual</th>
          <th>Total Rupiah</th>
        </tr>
      </thead>
      <tbody>
        ${Object.keys(count).map(j =>
          `<tr><td>${j}</td><td>${count[j]}</td><td>Rp${sum[j].toLocaleString()}</td></tr>`
        ).join('')}
        <tr class="table-info fw-bold"><td colspan="2">Total</td><td>Rp${total.toLocaleString()}</td></tr>
      </tbody>
    </table>
  `;
  document.getElementById('reportTable').innerHTML = html;

  // Chart tren penjualan 7 hari terakhir
  renderSalesChart();
}

function renderSalesChart() {
  let chartCanvasId = 'trendChart';
  let chartContainer = document.getElementById('salesChart');
  chartContainer.innerHTML = `<canvas id="${chartCanvasId}" height="80"></canvas>`;

  let allVouchers = loadLocalVouchers();

  // Ambil tanggal hari ini setiap kali fungsi dijalankan!
  let labels = [];
  let totals = [];
  for (let i = 6; i >= 0; i--) {
    let d = new Date(); // Buat objek baru tiap iterasi!
    d.setDate(d.getDate() - i);
    let dstr = d.toISOString().slice(0, 10); // Format YYYY-MM-DD
    labels.push(dstr.slice(5).replace('-','/')); // Format MM/DD (biar lebih jelas)
    let total = allVouchers.filter(v => (v.timestamp || '').slice(0, 10) === dstr).length;
    totals.push(total);
  }

  // Hapus chart sebelumnya jika ada
  if (window.trendChartObj) window.trendChartObj.destroy();

  let ctx = document.getElementById(chartCanvasId).getContext('2d');
  window.trendChartObj = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Penjualan Voucher',
        data: totals,
        borderWidth: 1,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          stepSize: 1,
          precision: 0
        }
      }
    }
  });
  console.log('renderSalesChart dijalankan!');
}

// Export ke Excel (.xlsx)
function exportToExcel() {
  let data = getReportData();
  if (!data.length) return showToast('Tidak ada data untuk diexport', 'warning');
  let ws_data = [
    ["Kode", "Jenis", "Harga", "Tanggal", "User", "Synced"],
    ...data.map(v=>[
      v.code,
      v.package || v.jenis,
      v.price || v.harga,
      formatDateTime(v.timestamp),
      v.userName,
      v.synced ? 'Ya' : 'Belum'
    ])
  ];
  let wb = XLSX.utils.book_new();
  let ws = XLSX.utils.aoa_to_sheet(ws_data);
  XLSX.utils.book_append_sheet(wb, ws, "PenjualanVoucher");
  XLSX.writeFile(wb, `PenjualanVoucher_${getTodayStr()}.xlsx`);
}
