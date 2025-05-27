// --- Login check ---
document.addEventListener('DOMContentLoaded', function () {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user || user.role !== "admin") {
        alert("Akses hanya untuk admin!");
        window.location.href = "index.html";
        return;
    }
});

// --- Fetch Data dari GAS ---
let allVoucherData = [];
let userList = {};

document.addEventListener('DOMContentLoaded', async () => {
    await fetchAllVouchers();
    setupFilters();
    renderAdminReport();
    document.getElementById('filterRange').addEventListener('change', renderAdminReport);
    document.getElementById('filterUser').addEventListener('change', renderAdminReport);
    document.getElementById('filterPaket').addEventListener('change', renderAdminReport);

    document.getElementById('btnLogout').onclick = function () {
        localStorage.removeItem('user');
        window.location.href = "index.html";
    };
});

// Fetch all data from GAS
async function fetchAllVouchers() {
    const res = await fetch(CONFIG.GAS_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            action: "getAllVouchers",
            userId: user.id
        })
    });
    const result = await res.json();
    if (result.status === "success") {
        allVoucherData = result.data || [];
        // Get unique user list for filter
        userList = {};
        allVoucherData.forEach(v => userList[v['User']] = v['User']);
        let opt = '<option value="">Semua Pengguna</option>';
        Object.values(userList).forEach(name => {
            opt += `<option value="${name}">${name}</option>`;
        });
        document.getElementById('filterUser').innerHTML = opt;
    } else {
        alert("Gagal mengambil data: " + result.message);
        allVoucherData = [];
    }
}

function setupFilters() {
    // Already handled above after fetch
}

// Filter + Render
function renderAdminReport() {
    let range = document.getElementById('filterRange').value;
    let userF = document.getElementById('filterUser').value;
    let paketF = document.getElementById('filterPaket').value;

    let now = new Date();
    let start, end;
    switch (range) {
        case 'today':
            start = new Date(now.setHours(0, 0, 0, 0));
            end = new Date(now.setHours(23, 59, 59, 999));
            break;
        case 'yesterday':
            start = new Date(now.setDate(now.getDate() - 1));
            start.setHours(0, 0, 0, 0);
            end = new Date(start);
            end.setHours(23, 59, 59, 999);
            break;
        case 'thisMonth':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            break;
        case 'lastMonth':
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            break;
        default:
            start = new Date(2000, 0, 1);
            end = new Date(2100, 0, 1);
    }

    let filtered = allVoucherData.filter(v => {
        // Filter by waktu
        let t = new Date(v['Timestamp'] || v['Tanggal'] || v['timestamp']);
        let ok = t >= start && t <= end;
        // Filter user
        if (userF) ok = ok && v['User'] === userF;
        // Filter paket
        if (paketF) ok = ok && (v['Jenis Paket'] === paketF || v['package'] === paketF);
        return ok;
    });

    // Rekap per paket
    let paketList = ['Paket1', 'Paket2', 'Paket3', 'Paket4', 'Paket5'];
    let count = {},
        sum = {},
        total = 0;
    paketList.forEach(p => {
        count[p] = 0;
        sum[p] = 0;
    });
    filtered.forEach(v => {
        let p = v['Jenis Paket'] || v['package'];
        let h = parseInt(v['Harga'] || v['price'] || 0);
        if (count[p] !== undefined) {
            count[p]++;
            sum[p] += h;
            total += h;
        }
    });

    // Tabel Rekap
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
        ${paketList.map(j =>
          `<tr><td>${j}</td><td>${count[j]}</td><td>Rp${sum[j].toLocaleString()}</td></tr>`
        ).join('')}
        <tr class="table-info fw-bold"><td colspan="2">Total</td><td>Rp${total.toLocaleString()}</td></tr>
      </tbody>
    </table>
  `;
    // Tabel Detail
    html += `
    <table class="table table-bordered table-sm">
      <thead>
        <tr>
          <th>No</th><th>Kode</th><th>Jenis Paket</th><th>Harga</th>
          <th>User</th><th>Timestamp</th><th>Device</th>
        </tr>
      </thead>
      <tbody>
        ${filtered.map((v,i)=>`
          <tr>
            <td>${i+1}</td>
            <td>${v['Kode']}</td>
            <td>${v['Jenis Paket'] || v['package']}</td>
            <td>Rp${(v['Harga'] || v['price'] || 0).toLocaleString()}</td>
            <td>${v['User']}</td>
            <td>${formatDateTime(v['Timestamp'] || v['Tanggal'] || v['timestamp'])}</td>
            <td>${v['Device']}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
    document.getElementById('adminReportTable').innerHTML = html;

    // Grafik 7 hari
    renderAdminSalesChart(filtered);
}

function formatDateTime(dt) {
    if (!dt) return '';
    try {
        let d = new Date(dt);
        return d.toLocaleString('id-ID');
    } catch {
        return dt;
    }
}

function renderAdminSalesChart(filtered) {
    let chartCanvasId = 'adminTrendChart';
    let chartContainer = document.getElementById('adminSalesChart');
    chartContainer.innerHTML = `<canvas id="${chartCanvasId}" height="80"></canvas>`;

    // Data 7 hari terakhir
    let labels = [];
    let totals = [];
    let today = new Date();
    for (let i = 6; i >= 0; i--) {
        let d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
        let dstr = d.toISOString().slice(0, 10);
        labels.push(dstr.slice(5));
        let total = filtered.filter(v => (v['Timestamp'] || '').slice(0, 10) === dstr).length;
        totals.push(total);
    }

    if (window.adminTrendChartObj) window.adminTrendChartObj.destroy();

    let ctx = document.getElementById(chartCanvasId).getContext('2d');
    window.adminTrendChartObj = new Chart(ctx, {
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

function exportToExcelAdmin() {
    let range = document.getElementById('filterRange').value;
    let userF = document.getElementById('filterUser').value;
    let paketF = document.getElementById('filterPaket').value;
    let filtered = allVoucherData.filter(v => {
        let t = new Date(v['Timestamp'] || v['Tanggal'] || v['timestamp']);
        let now = new Date();
        let start, end;
        switch (range) {
            case 'today':
                start = new Date(now.setHours(0, 0, 0, 0));
                end = new Date(now.setHours(23, 59, 59, 999));
                break;
            case 'yesterday':
                start = new Date(now.setDate(now.getDate() - 1));
                start.setHours(0, 0, 0, 0);
                end = new Date(start);
                end.setHours(23, 59, 59, 999);
                break;
            case 'thisMonth':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                break;
            case 'lastMonth':
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
                break;
            default:
                start = new Date(2000, 0, 1);
                end = new Date(2100, 0, 1);
        }
        let ok = t >= start && t <= end;
        if (userF) ok = ok && v['User'] === userF;
        if (paketF) ok = ok && (v['Jenis Paket'] === paketF || v['package'] === paketF);
        return ok;
    });
    if (!filtered.length) return alert('Tidak ada data untuk diexport');
    let ws_data = [
        ["Kode", "Jenis", "Harga", "User", "Timestamp", "Device"],
        ...filtered.map(v => [
            v['Kode'], v['Jenis Paket'] || v['package'], v['Harga'] || v['price'],
            v['User'], formatDateTime(v['Timestamp'] || v['Tanggal'] || v['timestamp']), v['Device']
        ])
    ];
    let wb = XLSX.utils.book_new();
    let ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, "LaporanPenjualan");
    XLSX.writeFile(wb, `LaporanPenjualanAdmin_${(new Date()).toISOString().slice(0,10)}.xlsx`);
}
console.log("User di localStorage:", localStorage.getItem('user'));