// Menangani input voucher, simpan, hapus

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
        package: info.jenis,
        price: info.harga,
        userId: user.id,
        userName: user.name,
        timestamp: new Date().toISOString(),
        device: navigator.userAgent,
        synced: false
    };
    if (!addVoucherLocal(data)) return;
    renderReport();
    document.getElementById('manualInput').value = '';
    showVoucherInfo('');
    renderReport();
    updateTerjualHariIni();
}

function deleteVoucher(code) {
    removeVoucherLocal(code);
    renderReport();
    updateTerjualHariIni();
}

function updateTerjualHariIni() {
    const badge = document.getElementById('badgeTerjualHariIni');
    if (!badge) return;

    const user = JSON.parse(localStorage.getItem('user'));
    let vouchers = [];
    try {
        vouchers = JSON.parse(localStorage.getItem('voucher_data')) || [];
    } catch (e) {
        vouchers = [];
    }

    // Hanya tampilkan data user login
    vouchers = vouchers.filter(v => v.userId === user.id);

    let today = new Date().toISOString().slice(0, 10);
    let totalToday = vouchers.filter(v => (v.timestamp || '').slice(0, 10) === today).length;
    let totalAll = vouchers.length;
    badge.textContent = `Terjual hari ini: ${totalToday} | Total: ${totalAll}`;
}

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
