// admin.js

const ADMIN_KEY = "ORBITNET-ADMIN-2024";
const GAS_URL = "https://script.google.com/macros/s/AKfycbyU-MGApTAATPyEhj9hRlEXmnuYhKAYcigdJ_JtLletPGzd6gQGAZd1ZHCiGttG5B7o/exec"; // sesuaikan

let user; // global var

document.addEventListener("DOMContentLoaded", function() {
  user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!user || user.email !== ADMIN_EMAIL) {
    alert("Akses hanya untuk admin!");
    window.location.href = "index.html";
    return;
  }
  document.getElementById("adminInfo").innerHTML = `Login sebagai: <b>${user.name}</b> (${user.email})`;

  fetchAllVouchers();
});

let allVouchers = []; // cache data dari Sheet

async function fetchAllVouchers() {
  try {
    // Panggil endpoint dengan action & key admin
    const url = GAS_URL + "?action=getAllVouchers&key=" + encodeURIComponent(ADMIN_KEY);
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "success") throw new Error(data.message);

    // Semua voucher di data.data
    allVouchers = data.data || [];
    // -- Isi filter user seperti sebelumnya
    let users = {};
    allVouchers.forEach(v => users[v.user] = v.user); // 'user' = field di sheet/JSON

    let userOpts = '<option value="">Semua Pengguna</option>';
    Object.entries(users).forEach(([id, name]) => {
      userOpts += `<option value="${id}">${name || id}</option>`;
    });
    document.getElementById('filterUser').innerHTML = userOpts;
    renderAdminReport();

  } catch (e) {
    document.getElementById('adminReportTable').innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
  }
}

// Tampilkan laporan di tabel (filter sesuai drop-down)
function renderAdminReport() {
  let filterUser = document.getElementById("filterUser").value;
  let filterPaket = document.getElementById("filterPaket").value;

  // Filter
  let data = allVouchers;
  if (filterUser) data = data.filter(v => v.userId === filterUser);
  if (filterPaket) data = data.filter(v => v.package === filterPaket);

  // Rekap per user
  let summary = {};
  data.forEach(v => {
    if (!summary[v.userId]) summary[v.userId] = { name: v.userName, count: 0, total: 0 };
    summary[v.userId].count += 1;
    summary[v.userId].total += parseInt(v.price || 0);
  });

  // Tabel
  let html = `
    <h5>Rekap Total Penjualan Voucher</h5>
    <table class="table table-bordered">
      <thead>
        <tr>
          <th>User</th><th>Jumlah Voucher</th><th>Total (Rp)</th>
        </tr>
      </thead>
      <tbody>
        ${
          Object.values(summary).map(u =>
            `<tr><td>${u.name}</td><td>${u.count}</td><td>Rp${u.total.toLocaleString()}</td></tr>`
          ).join('')
        }
        <tr class="table-info">
          <td><b>Total Seluruh User</b></td>
          <td><b>${Object.values(summary).reduce((a,b)=>a+b.count,0)}</b></td>
          <td><b>Rp${Object.values(summary).reduce((a,b)=>a+b.total,0).toLocaleString()}</b></td>
        </tr>
      </tbody>
    </table>
    <h5>Data Detail Penjualan</h5>
    <table class="table table-sm table-bordered table-hover">
      <thead>
        <tr>
          <th>Kode</th><th>Paket</th><th>Harga</th>
          <th>User</th><th>Timestamp</th><th>Device</th>
        </tr>
      </thead>
      <tbody>
        ${data.map(v=>`
          <tr>
            <td>${v.code}</td>
            <td>${v.package}</td>
            <td>Rp${parseInt(v.price||0).toLocaleString()}</td>
            <td>${v.userName || v.userId}</td>
            <td>${v.timestamp? (""+v.timestamp).replace("T"," ").slice(0,19):""}</td>
            <td>${v.device||""}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  document.getElementById('adminReportTable').innerHTML = html;
}

// Event listener untuk filter
document.addEventListener('change', function(e) {
  if (["filterUser", "filterPaket"].includes(e.target.id)) renderAdminReport();
});