//------------------------------------------------------------
//  CẤU HÌNH ENDPOINT
//------------------------------------------------------------
const API = {
  login: "/auth/login",
  register: "/auth/register",
  logout: "/auth/logout"
};

//------------------------------------------------------------
//  Hàm tiện ích hiển thị thông báo
//------------------------------------------------------------
function showMsg(msg, type = "error") {
  const el = document.getElementById("msg");
  if (!el) return;
  el.textContent = msg;
  el.style.color = (type === "success" ? "green" : "red");
}

//------------------------------------------------------------
//  Redirect đơn giản (cookies sẽ tự động được gửi)
//------------------------------------------------------------
function redirectTo(url) {
  window.location.href = url;
}

//------------------------------------------------------------
//  Gọi API đăng nhập
//------------------------------------------------------------
async function loginHandler(evt) {
  evt.preventDefault();
  const form = Object.fromEntries(new FormData(evt.target));
  showMsg("⏳ Đang kiểm tra...");
  try {
    const res = await fetch(API.login, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (res.ok) {
      showMsg("✅ Đăng nhập thành công!", "success");
      setTimeout(() => {
        redirectTo("/menu");
      }, 500);
    } else {
      showMsg("❌ " + (data.detail || "Đăng nhập thất bại"));
    }
  } catch (err) {
    showMsg("❌ Lỗi kết nối server!");
  }
}

//------------------------------------------------------------
//  Gọi API đăng ký
//------------------------------------------------------------
async function signupHandler(evt) {
  evt.preventDefault();
  const form = Object.fromEntries(new FormData(evt.target));
  showMsg("⏳ Đang tạo tài khoản...");
  try {
    const res = await fetch(API.register, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (res.ok) {
      showMsg("✅ Đăng ký thành công!", "success");
      setTimeout(() => {
        redirectTo("/menu");
      }, 500);
    } else {
      showMsg("❌ " + (data.detail || "Email đã tồn tại!"));
    }
  } catch (err) {
    showMsg("❌ Lỗi kết nối server!");
  }
}

//------------------------------------------------------------
//  Gọi API logout
//------------------------------------------------------------
async function logoutHandler() {
  try {
    const res = await fetch(API.logout, {
      method: "POST"
    });
    if (res.ok) {
      redirectTo("/");
    } else {
      showMsg("❌ Lỗi khi đăng xuất!");
    }
  } catch (err) {
    showMsg("❌ Lỗi kết nối server!");
  }
}

//------------------------------------------------------------
//  GẮN SỰ KIỆN VÀO FORM
//------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const loginForm  = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const logoutBtn  = document.getElementById("logoutBtn");
  
  if (loginForm)  loginForm.addEventListener("submit", loginHandler);
  if (signupForm) signupForm.addEventListener("submit", signupHandler);
  if (logoutBtn)  logoutBtn.addEventListener("click", logoutHandler);
});

//------------------------------------------------------------
//  Hàm public: logout (có thể gọi từ HTML)
//------------------------------------------------------------
window.logout = logoutHandler;
