// Fungsi bantu: tanggal, ID unik, toast, validasi kode voucher
function getTodayStr() {
  const d = new Date();
  return d.toISOString().slice(0,10);
}

function formatDateTime(dt) {
  const d = new Date(dt);
  return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function generateId() {
  return 'vid-' + Date.now() + '-' + Math.floor(Math.random()*10000);
}

// Toast message
function showToast(msg, type = 'success', timeout = 2500) {
  let toast = document.createElement('div');
  toast.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;
  toast.innerText = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), timeout);
}

// utils.js atau global JS lain
let lang = {};
function setLanguage(l = 'id') {
  fetch(`lang/${l}.json`)
    .then(r => r.json())
    .then(data => {
      lang = data;
      // Ganti label semua elemen dengan data-i18n
      document.querySelectorAll('[data-i18n]').forEach(el => {
        el.innerText = lang[el.getAttribute('data-i18n')] || el.innerText;
      });
      // (optional) Simpan preferensi ke localStorage
      localStorage.setItem('lang', l);
    });
}


// Validasi kode voucher dan tentukan jenis/harga paket
function parseVoucherCode(code) {
  if(!/^[A-Za-z0-9]{7}$/.test(code)) return null;
  const paket = code[1];
  let jenis, harga;
  switch (paket) {
    case "1": jenis = "Paket1"; harga = 10000; break;
    case "2": jenis = "Paket2"; harga = 20000; break;
    case "3": jenis = "Paket3"; harga = 30000; break;
    case "8": jenis = "Paket4"; harga = 50000; break;
    case "0": jenis = "Paket5"; harga = 150000; break;
    default: return null;
  }
  return { code, jenis, harga };
}
