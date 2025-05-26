// Sinkronisasi data dengan Google Sheets via GAS

async function syncVouchers() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) return;
  const vouchers = loadLocalVouchers().filter(v => !v.synced);
  if (vouchers.length === 0) return showToast('Tidak ada data yang perlu disinkron!', 'info');

  showToast('Sinkronisasi dimulai...', 'info');
  for (let data of vouchers) {
    try {
      let res = await fetch(CONFIG.GAS_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          action: 'append',
          voucher: { ...data, userId: user.id, userName: user.name }
        })
      });
      let result = await res.json();
      if (result.success) {
        data.synced = true;
        data.syncedAt = Date.now();
      } else {
        showToast(result.message || 'Gagal sync voucher', 'danger');
      }
    } catch (err) {
      showToast('Gagal koneksi saat sync', 'danger');
    }
  }
  saveLocalVouchers(loadLocalVouchers().map(v => {
    let local = vouchers.find(lv => lv.code === v.code);
    return local ? {...v, ...local} : v;
  }));
  showToast('Sinkronisasi selesai!', 'success');
  renderReport();
}

window.addEventListener('online', () => {
  showToast('Online, mulai sinkronisasi...', 'info');
  syncVouchers();
});

// Tombol manual trigger
function forceSync() {
  syncVouchers();
}
