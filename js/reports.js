// Laporan penjualan, filter, dan grafik

function getReportData() {
  const range = document.getElementById('filterRange').value;
  const userId = document.getElementById('filterUser').value;
  const paket = document.getElementById('filterPaket').value;

  let all = loadLocalVouchers();

  // Filter data by waktu
  let start, end, now = new Date();
  switch(range) {
    case 'today':
      start = new Date(now.setHours(0,0,0,0));
      end = new Date(now.setHours(23,59,59,999));
      break;
    case 'yesterday':
      start = new Date(now.setDate(now.getDate()-1));
      start.setHours(0,0,0,0);
      end = new Date(start);
      end.setHours(23,59,59,999);
      break;
    case 'thisMonth':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth()+1, 0, 23,59,59,999);
      break;
    case 'lastMonth':
      start = new Date(now.getFullYear(), now.getMonth()-1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23,59,59,999);
      break;
    default:
      start = new Date(2000,0,1);
      end = new Date(2100,0,1);
  }

  let data = all.filter(v => {
    let t = new Date(v.timestamp || v.time);
    let ok = t >= start && t <= end;
    if (userId) ok = ok && v.userId === userId;
    if (paket) ok = ok && v.jenis && v.jenis.endsWith(paket);
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
    if (v.jenis && count[v.jenis] !== undefined) {
      count[v.jenis]++;
      sum[v.jenis] += parseInt(v.harga||0);
      total += parseInt(v.harga||0);
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

  // Chart tren (pakai Chart.js jika ingin lebih keren, ini dummy chart)
  renderSalesChart(data);

  // Filter user (dropdown)
  let all = loadLocalVouchers();
  let users = {};
  all.forEach(v => users[v.userId] = v.userName);
  let opt = '<option value="">Semua Pengguna</option>';
  Object.entries(users).forEach(([id, name])=>{
    opt += `<option value="${id}">${name||id}</option>`;
  });
  document.getElementById('filterUser').innerHTML = opt;
}

function renderSalesChart() {
  let chartCanvasId = 'trendChart';
  let chartContainer = document.getElementById('salesChart');
  chartContainer.innerHTML = `<canvas id="${chartCanvasId}" height="80"></canvas>`;

  // --- Ambil userId login untuk filter grafik (hanya data user login, admin = semua)
  const user = JSON.parse(localStorage.getItem('user'));
  let allVouchers = loadLocalVouchers();
  // Kalau admin, grafik total semua user; kalau user biasa, hanya userId-nya
  if (!user || user.role !== 'admin') {
    allVouchers = allVouchers.filter(v => v.userId === user.id);
  }

  // --- Data 7 hari terakhir (label selalu 7 hari terakhir!)
  let labels = [];
  let totals = [];
  let today = new Date();
  for (let i = 6; i >= 0; i--) {
    let d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    let dstr = d.toISOString().slice(0, 10);
    labels.push(dstr.slice(5)); // MM-DD
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
      scales: {
        y: {
          beginAtZero: true,
          stepSize: 1,
          precision: 0
        }
      }
    }
  });
}


// Export ke Excel (.xlsx)
function exportToExcel() {
  let data = getReportData();
  if (!data.length) return showToast('Tidak ada data untuk diexport', 'warning');
  let ws_data = [
    ["Kode", "Jenis", "Harga", "Tanggal", "User", "Synced"],
    ...data.map(v=>[
      v.code, v.jenis, v.harga, formatDateTime(v.timestamp), v.userName, v.synced?'Ya':'Belum'
    ])
  ];
  let wb = XLSX.utils.book_new();
  let ws = XLSX.utils.aoa_to_sheet(ws_data);
  XLSX.utils.book_append_sheet(wb, ws, "PenjualanVoucher");
  XLSX.writeFile(wb, `PenjualanVoucher_${getTodayStr()}.xlsx`);
}
