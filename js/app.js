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
        ...info,
        code: code,
        harga: info.harga,
        jenis: info.jenis,
        userId: user.id,
        userName: user.name,
        timestamp: new Date().toISOString(),
        synced: false
    };
    if (!addVoucherLocal(data)) return;
    renderReport();
    document.getElementById('manualInput').value = '';
    showVoucherInfo('');
    renderReport(); // render laporan penjualan
    updateTerjualHariIni(); // update badge setelah simpan voucher
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
});


window.saveVoucher = saveVoucher;
window.startScan = startScan;
window.exportToExcel = exportToExcel;
window.resetLocalData = resetLocalData;
window.renderReport = renderReport;
window.forceSync = forceSync;