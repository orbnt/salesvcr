function onGoogleSignIn(googleUser) {
  const profile = googleUser.getBasicProfile();
  const user = {
    id: profile.getId(),
    name: profile.getName(),
    email: profile.getEmail(),
    role: profile.getEmail() === "admin@example.com" ? "admin" : "user"
  };
  localStorage.setItem("user", JSON.stringify(user));
  document.getElementById("userInfo").textContent = `Halo, ${user.name}`;
  // Optionally redirect or initialize app
}

function checkLogin() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    window.location.href = "login.html";
  } else {
    document.getElementById("userInfo").textContent = `Halo, ${user.name}`;
  }
}

document.getElementById("btnLogout").addEventListener("click", () => {
  localStorage.removeItem("user");
  window.location.href = "login.html";
});

document.addEventListener("DOMContentLoaded", checkLogin);