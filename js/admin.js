// admin.js

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
  const user = JSON.parse(localStorage.getItem('user'));
  // Proteksi: hanya admin boleh akses
  if (!user || user.email !== 'orbitnethotspot@gmail.com') {
    document.getElementById('adminReportTable').innerHTML = '<div class="alert alert-danger">Akses hanya untuk admin!</div>';
    return;
  }
  const url = `${CONFIG.GAS_URL}?action=getAllVouchers&key=${CONFIG.ADMIN_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.status !== "success") throw new Error(data.message);
    // Tampilkan ke tabel
    renderAdminReport(data.data || []);
  } catch (e) {
    document.getElementById('adminReportTable').innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
  }
}

// Tampilkan laporan di tabel (filter sesuai drop-down)
function renderAdminReport(allVouchers) {
  let users = {};
  allVouchers.forEach(v => users[v.UserId] = v.UserName);
  let filterHtml = '<select id="filterUserAdmin"><option value="">Semua Pengguna</option>';
  Object.entries(users).forEach(([id, name])=>{
    filterHtml += `<option value="${id}">${name || id}</option>`;
  });
  filterHtml += '</select>';

  let html = `
    <div>
      <label>Filter User: </label> ${filterHtml}
    </div>
    <table class="table table-bordered table-sm align-middle text-center">
      <thead>
        <tr>
          <th>Kode</th><th>Jenis Paket</th><th>Harga</th>
          <th>UserId</th><th>UserName</th><th>Timestamp</th><th>Device</th>
        </tr>
      </thead>
      <tbody>
        ${allVouchers.map(v => `
          <tr>
            <td>${v.Kode}</td>
            <td>${v["Jenis Paket"]}</td>
            <td>${v.Harga}</td>
            <td>${v.UserId}</td>
            <td>${v.UserName}</td>
            <td>${v.Timestamp}</td>
            <td>${v.Device}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  document.getElementById('adminReportTable').innerHTML = html;

  // Filter
  document.getElementById('filterUserAdmin').addEventListener('change', function() {
    const uid = this.value;
    const filtered = uid ? allVouchers.filter(v => v.UserId === uid) : allVouchers;
    renderAdminReport(filtered); // Rekursif, tampilkan ulang!
  });
}

document.addEventListener('DOMContentLoaded', fetchAllVouchers);

// Event listener untuk filter
document.addEventListener('change', function(e) {
  if (["filterUser", "filterPaket"].includes(e.target.id)) renderAdminReport();
});