import { startRecording } from "/static/js/recorder.js";  // ghi âm 3s im lặng

// Hàm tiện ích lấy header xác thực
function getAuthHeaders() {
  const email = sessionStorage.getItem("email");
  const password = sessionStorage.getItem("password");
  return { "x-email": email, "x-password": password };
}

const btn   = document.getElementById("start");
const stat  = document.getElementById("status");
const conv  = document.getElementById("conversation");

btn.onclick = async () => {
  stat.textContent = "Listening…";
  const blob = await startRecording(); // trả về audio Blob
  stat.textContent = "Processing…";

  const fd = new FormData();
  fd.append("file", blob, "speech.webm");

  try {
    // Gửi header xác thực qua fetch (dùng FormData nên phải thêm thủ công)
    const res = await fetch("/api/voice", {
      method: "POST",
      body: fd,
      headers: getAuthHeaders()
      // Không set Content-Type, trình duyệt sẽ tự tạo boundary cho FormData
    });

    if (!res.ok) {
      if (res.status === 401) {
        sessionStorage.clear();
        location.href = "/";
        return;
      }
      throw new Error(await res.text());
    }

    const data = await res.json(); // {user, answer}
    conv.innerHTML += `<p><b>You:</b> ${data.user}</p>`;
    conv.innerHTML += `<p><b>AI:</b> ${data.answer}</p>`;

    // Phát TTS
    const utter = new SpeechSynthesisUtterance(data.answer);
    utter.lang = "en-US";
    speechSynthesis.speak(utter);
    stat.textContent = "";
  } catch (err) {
    stat.textContent = "❌ " + err.message;
  }
};
