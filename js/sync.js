// Sinkronisasi data dengan Google Sheets via GAS

function syncVoucherHotspot() {
    const vouchers = loadLocalVouchers().filter(v => !v.synced); // Ambil voucher lokal yang belum sync
    if (vouchers.length === 0) return alert("Tidak ada voucher baru untuk dikirim!");

    fetch("https://script.google.com/macros/s/AKfycbwL_z8zbRTWG4jsFkKjSHjWHGuGPcHzTR8o0wnvnX57qaA1jWPLbvFCk56puSuDwRO3xg/exec", {
        method: 'POST',
        mode: 'no-cors', // supaya bebas CORS
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vouchers) // langsung array voucher, tanpa object action
    })
    .then(() => {
        vouchers.forEach(v => v.synced = true);
        // Update ke localStorage
        const all = loadLocalVouchers();
        all.forEach(v => {
            if (vouchers.find(x => x.code === v.code)) v.synced = true;
        });
        saveLocalVouchers(all);
        alert(`Berhasil mengirim ${vouchers.length} voucher ke Google Sheet.`);
        renderReport && renderReport(); // update report jika ada
    })
    .catch(err => {
        alert("Gagal mengirim voucher. Data tetap tersimpan lokal.");
        console.error(err);
    });
}


window.addEventListener('online', () => {
  showToast('Online, mulai sinkronisasi...', 'info');
  syncVoucherHotspot();
});

// Tombol manual trigger
function forceSync() {
  syncVoucherHotspot();
}
