// Manajemen data di localStorage & deteksi duplikat
const LOCAL_KEY = "voucher_data";

function loadLocalVouchers() {
  let arr = [];
  try { arr = JSON.parse(localStorage.getItem(LOCAL_KEY)) || []; } catch {}
  return arr;
}

function saveLocalVouchers(arr) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(arr));
}

function addVoucherLocal(data) {
  let arr = loadLocalVouchers();
  if (arr.some(v => v.code === data.code)) {
    showToast('Voucher sudah ada di data lokal!', 'danger');
    return false;
  }
  arr.push(data);
  saveLocalVouchers(arr);
  showToast('Voucher berhasil disimpan di lokal!');
  return true;
}

function removeVoucherLocal(code) {
  let arr = loadLocalVouchers().filter(v => v.code !== code);
  saveLocalVouchers(arr);
  showToast('Voucher dihapus dari data lokal', 'info');
}

function updateVoucherLocal(code, newData) {
  let arr = loadLocalVouchers().map(v => v.code === code ? {...v, ...newData} : v);
  saveLocalVouchers(arr);
  showToast('Voucher diupdate', 'info');
}

function resetLocalData() {
  if (confirm('Yakin akan menghapus semua data lokal voucher?')) {
    localStorage.removeItem(LOCAL_KEY);
    showToast('Data lokal direset!', 'warning');
    renderReport && renderReport();
  }
  renderReport();
  updateTerjualHariIni();
}
