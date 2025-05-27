// Sinkronisasi data dengan Google Sheets via GAS

function syncVoucherHotspot() {
    // Ambil voucher lokal yang belum sync, lalu pastikan field sesuai GAS
    const vouchers = loadLocalVouchers().filter(v => !v.synced).map(v => ({
        code: v.code,
        package: v.package || v.jenis,      // fallback ke v.jenis jika perlu
        price: v.price || v.harga,          // fallback ke v.harga jika perlu
        userId: v.userId,
        timestamp: v.timestamp,
        device: v.device || navigator.userAgent, // fallback
        synced: true
    }));

    if (vouchers.length === 0) return alert("Tidak ada voucher baru untuk dikirim!");

    fetch("https://script.google.com/macros/s/AKfycbyU-MGApTAATPyEhj9hRlEXmnuYhKAYcigdJ_JtLletPGzd6gQGAZd1ZHCiGttG5B7o/exec", {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vouchers)
    })
    .then(() => {
        // update status synced di local
        const all = loadLocalVouchers();
        all.forEach(v => {
            if (vouchers.find(x => x.code === v.code)) v.synced = true;
        });
        saveLocalVouchers(all);
        alert(`Berhasil mengirim ${vouchers.length} voucher ke Google Sheet.`);
        renderReport && renderReport();
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
