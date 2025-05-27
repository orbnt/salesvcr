// Sinkronisasi data dengan Google Sheets via GAS

function syncVouchersNoCORS() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) return;
  const vouchers = loadLocalVouchers().filter(v => !v.synced);
  if (vouchers.length === 0) return showToast('Tidak ada data yang perlu disinkron!', 'info');

  showToast('Sinkronisasi dikirim...', 'info');

  fetch(CONFIG.GAS_URL, { // <--- ini yang benar!
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: "addVoucher",
      data: vouchers
    })
  })
  .then(() => {
    saveLocalVouchers(loadLocalVouchers().map(v => {
      if (vouchers.some(lv => lv.code === v.code)) {
        return { ...v, synced: true };
      }
      return v;
    }));
    showToast('Sinkronisasi (dikirim) — Cek Google Sheet Anda!', 'success');
    renderReport();
  })
  .catch(() => {
    showToast('Gagal sinkron (cek koneksi Anda)', 'danger');
  });
}


window.addEventListener('online', () => {
  showToast('Online, mulai sinkronisasi...', 'info');
  syncVouchersNoCORS();
});

// Tombol manual trigger
function forceSync() {
  syncVouchersNoCORS();
}
