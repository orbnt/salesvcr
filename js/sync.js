// Sinkronisasi data dengan Google Sheets via GAS

async function syncVouchers() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) return;
  // Ambil voucher lokal yang belum synced
  const vouchers = loadLocalVouchers().filter(v => !v.synced);
  if (vouchers.length === 0) return showToast('Tidak ada data yang perlu disinkron!', 'info');

  showToast('Sinkronisasi dimulai...', 'info');
  
  // Kirim seluruh array vouchers sekaligus
  fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: "addVoucher",
      data: vouchers
    })
  })
  .then(res => res.text())
  .then(txt => {
    try {
      const json = JSON.parse(txt);
      if (json.status === "success") {
        // Update status synced lokal
        saveLocalVouchers(loadLocalVouchers().map(v => {
          if (vouchers.some(lv => lv.code === v.code)) {
            return {...v, synced: true};
          }
          return v;
        }));
        showToast("Sinkronisasi berhasil: " + json.message, 'success');
        renderReport();
      } else {
        showToast("Gagal: " + (json.message || "Error"), 'danger');
      }
    } catch (e) {
      showToast("Respon server tidak dikenali: " + txt, 'danger');
    }
  })
  .catch(err => {
    showToast("Fetch error: " + err, 'danger');
  });
}

window.addEventListener('online', () => {
  showToast('Online, mulai sinkronisasi...', 'info');
  syncVouchers();
});

// Tombol manual trigger
function forceSync() {
  syncVouchers();
}
