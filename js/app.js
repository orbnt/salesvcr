// Menangani input voucher, simpan, edit, hapus

function saveVoucher() {
    const code = document.getElementById('manualInput').value.trim();
    const info = parseVoucherCode(code);
    const user = JSON.parse(localStorage.getItem('user'));
    if (!info) {
        showToast('Kode voucher tidak valid', 'danger');
        return;
    }
    let data = {
        code: code,
        package: info.jenis,     // gunakan 'package', isi dari info.jenis
        price: info.harga,       // gunakan 'price', isi dari info.harga
        userId: user.id,
        userName: user.name,
        timestamp: new Date().toISOString(),
        device: navigator.userAgent, // isi field device (misal: Chrome/Android/iPhone)
        synced: false
    };
    if (!addVoucherLocal(data)) return;
    renderReport();
    document.getElementById('manualInput').value = '';
    showVoucherInfo('');
    renderReport();
    updateTerjualHariIni();
}

function editVoucher(code) {
    // tampilkan modal edit jika diperlukan
}

function deleteVoucher(code) {
    removeVoucherLocal(code);
    renderReport();
    updateTerjualHariIni();
}

// Update live badge "Terjual hari ini"
function updateTerjualHariIni() {
    const badge = document.getElementById('badgeTerjualHariIni');
    if (!badge) return;

    // Dapatkan data user login
    const user = JSON.parse(localStorage.getItem('user'));

    // INISIALISASI vouchers!
    let vouchers = [];
    try {
        vouchers = JSON.parse(localStorage.getItem('voucher_data')) || [];
    } catch (e) {
        vouchers = [];
    }

    // Filter voucher sesuai user (kecuali admin)
    if (user && user.role !== 'admin') {
        vouchers = vouchers.filter(v => v.userId === user.id);
    }

    // Hitung sesuai tanggal hari ini
    let today = new Date().toISOString().slice(0, 10);
    let totalToday = vouchers.filter(v => (v.timestamp || '').slice(0, 10) === today).length;
    let totalAll = vouchers.length;
    badge.textContent = `Terjual hari ini: ${totalToday} | Total: ${totalAll}`;
}



// Panggil ini sekali saat DOM ready, dan tiap data voucher berubah!
document.addEventListener('DOMContentLoaded', () => {
    renderReport();
    updateTerjualHariIni();
    setInterval(updateTerjualHariIni, 5000); // opsional

    // --- Tampilkan tombol admin jika login sebagai admin ---
    const user = JSON.parse(localStorage.getItem('user'));
    const adminEmail = "orbitnethotspot@gmail.com";
    if (user && user.email === adminEmail) {
        const btn = document.getElementById('btnAdminReport');
        if (btn) btn.style.display = "";
    }
});

// Panggil setelah user login atau reload halaman
async function fetchUserVouchers() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) return;
  const url = `${CONFIG.GAS_URL}?action=getUserVouchers&userId=${encodeURIComponent(user.id)}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === "success") {
      saveLocalVouchers(data.data || []);
      renderReport(); // Tampilkan ke tabel laporan user
    } else {
      showToast('Gagal load data user dari Sheet', 'danger');
    }
  } catch (e) {
    showToast('Gagal load data dari Sheet: ' + e.message, 'danger');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchUserVouchers();
  // ... fungsi lain seperti renderReport()
});


window.saveVoucher = saveVoucher;
window.startScan = startScan;
window.exportToExcel = exportToExcel;
window.resetLocalData = resetLocalData;
window.renderReport = renderReport;
window.forceSync = forceSync;