// app/presentation/static/js/dictionary.js

// Hàm tiện ích lấy header xác thực
function getAuthHeaders() {
  const email = sessionStorage.getItem("email");
  const password = sessionStorage.getItem("password");
  return { "x-email": email, "x-password": password };
}

(() => {
  const input   = document.getElementById("word");
  const btn     = document.getElementById("lookup");
  const result  = document.getElementById("result");

  // Nhấn Enter cũng tra cứu
  input.addEventListener("keyup", e => { if (e.key === "Enter") btn.click(); });

  btn.addEventListener("click", async () => {
    const word = input.value.trim();
    if (!word) return;

    result.textContent = "Đang tra…";

    try {
      // Thêm header xác thực ở đây!
      const r  = await fetch(`/api/dictionary/${encodeURIComponent(word)}`, {
        headers: getAuthHeaders()
      });
      if (!r.ok) throw new Error(await r.text());
      const js = await r.json();        // {word, phonetic, definitions:[], example:""}
      render(js);
      speak(js);
    } catch (err) {
      // Nếu bị lỗi xác thực thì về trang đăng nhập luôn cho an toàn
      if (err.message.includes("401")) {
        sessionStorage.clear();
        location.href = "/";
      } else {
        result.textContent = "❌ " + err.message;
      }
    }
  });

  function render(data) {
    const defs = data.definitions.map((d, i) => `${i + 1}. ${d}`).join("\n");
    result.textContent =
`• ${data.word}  /${data.phonetic || ""}/

${defs}

Ví dụ: ${data.example || "—"}`;
  }

  function speak({word, definitions}) {
    const u = new SpeechSynthesisUtterance(`${word}. ${definitions[0]}`);
    u.lang = "en-US";
    speechSynthesis.speak(u);
  }
})();
