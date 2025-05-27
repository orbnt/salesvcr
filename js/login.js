// login.js
window.addEventListener("DOMContentLoaded", function () {
  if (localStorage.getItem("user")) window.location.href = "index.html";

  function handleCredentialResponse(response) {
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    const user = {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
      role: payload.email === "orbitnethotspot@gmail.com" ? "admin" : "user"
    };
    localStorage.setItem("user", JSON.stringify(user));
    window.location.href = "index.html";
  }

  function initGsi() {
    if (typeof google === "undefined" || !google.accounts || !google.accounts.id) {
      // Google GSI belum siap, coba lagi 100ms kemudian
      return setTimeout(initGsi, 100);
    }
    if (typeof CONFIG === "undefined") {
      alert("Konfigurasi belum dimuat. Cek urutan script config.js!");
      return;
    }
    google.accounts.id.initialize({
      client_id: CONFIG.CLIENT_ID,
      callback: handleCredentialResponse
    });
    google.accounts.id.renderButton(
      document.getElementById("g_id_signin"),
      { theme: "outline", size: "large" }
    );
  }

  // Start GSI init
  initGsi();
});
