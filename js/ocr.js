// Mengaktifkan kamera & OCR dengan Tesseract.js untuk baca voucher
async function startScan() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showToast("Kamera tidak tersedia", "danger");
    return;
  }
  // Buat input kamera
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.capture = 'environment';
  input.onchange = async (e) => {
    if (e.target.files.length) {
      let img = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async (ev) => {
        let result = await Tesseract.recognize(ev.target.result, 'eng');
        let code = result.data.text.replace(/[^A-Za-z0-9]/g, '').substr(0, 7);
        if (code && parseVoucherCode(code)) {
          document.getElementById('manualInput').value = code;
          showVoucherInfo(code);
        } else {
          showToast('Voucher tidak terdeteksi, silakan input manual.', 'warning');
        }
      };
      reader.readAsDataURL(img);
    }
  };
  input.click();
}

function showVoucherInfo(code) {
  const info = parseVoucherCode(code);
  let el = document.getElementById('voucherInfo');
  if (info) {
    el.classList.remove('d-none');
    el.innerText = `Kode: ${code}\nJenis: ${info.jenis}\nHarga: Rp${info.harga.toLocaleString()}`;
  } else {
    el.classList.add('d-none');
  }
}
