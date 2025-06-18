//------------------------------------------------------------
//  CẤU HÌNH ENDPOINT
//------------------------------------------------------------
const API = {
  login: "/auth/login",
  register: "/auth/register"
};

//------------------------------------------------------------
//  Lưu credentials vào sessionStorage (chỉ lưu tạm cho phiên làm việc)
//------------------------------------------------------------
function setCreds(email, pwd) {
  sessionStorage.setItem("email", email);
  sessionStorage.setItem("password", pwd);
}
function clearCreds() {
  sessionStorage.removeItem("email");
  sessionStorage.removeItem("password");
}
function getEmail() {
  return sessionStorage.getItem("email");
}
function getPassword() {
  return sessionStorage.getItem("password");
}

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
      setCreds(form.email, form.password);
      showMsg("✅ Đăng nhập thành công!", "success");
      setTimeout(() => location.href = "/menu", 500);
    } else {
      showMsg("❌ " + (data.detail || "Đăng nhập thất bại"));
      // Xoá thông tin cũ tránh lỗi "auto đăng nhập sai"
      clearCreds();
    }
  } catch (err) {
    showMsg("❌ Lỗi kết nối server!");
    clearCreds();
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
      setCreds(form.email, form.password);
      showMsg("✅ Đăng ký thành công!", "success");
      setTimeout(() => location.href = "/menu", 500);
    } else {
      showMsg("❌ " + (data.detail || "Email đã tồn tại!"));
      clearCreds();
    }
  } catch (err) {
    showMsg("❌ Lỗi kết nối server!");
    clearCreds();
  }
}

//------------------------------------------------------------
//  GẮN SỰ KIỆN VÀO FORM
//------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const loginForm  = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  if (loginForm)  loginForm.addEventListener("submit", loginHandler);
  if (signupForm) signupForm.addEventListener("submit", signupHandler);
});

//------------------------------------------------------------
//  Hàm public: clearCreds (nếu muốn logout)
//------------------------------------------------------------
window.clearCreds = clearCreds;
