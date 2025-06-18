// /static/js/voice.js
import { startRecording } from "/static/js/recorder.js";

function getAuthHeaders() {
  const email = sessionStorage.getItem("email");
  const password = sessionStorage.getItem("password");
  return { "x-email": email, "x-password": password };
}

const btn   = document.getElementById("start");
const stat  = document.getElementById("status");
const conv  = document.getElementById("conversation");

let first = true; // Đánh dấu lần đầu
let autoListening = false;

// Hàm phát TTS, đợi nói xong mới resolve
function speakText(text) {
  return new Promise(resolve => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.onend = resolve;
    speechSynthesis.speak(utter);
  });
}

async function ai_conversation_loop() {
  if (first) {
    stat.textContent = "Đang hỏi AI khởi động...";
    // Lần đầu: không ghi âm, chỉ gửi prompt "Bạn hãy bắt đầu huấn luyện tiếng anh"
    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt: "Bạn hãy bắt đầu huấn luyện tiếng anh" })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json(); // {answer:...}
      conv.innerHTML += `<p class="ai"><b>AI:</b> ${data.answer}</p>`;
      await speakText(data.answer);
      first = false;
      // Sau khi AI chào, chuyển sang chế độ ghi âm auto
      autoListening = true;
      await ai_conversation_loop();
    } catch (err) {
      stat.textContent = "❌ " + err.message;
      autoListening = false;
    }
    return;
  }
  // Các vòng tiếp theo: Ghi âm, gửi audio kèm prompt "Bạn giúp tôi kiểm tra từ vựng và ngữ pháp: ..."
  stat.textContent = "Listening…";
  const blob = await startRecording();
  stat.textContent = "Processing…";
  // Gửi file ghi âm lên server
  const fd = new FormData();
  fd.append("file", blob, "speech.webm");
  try {
    const res = await fetch("/api/voice", {
      method: "POST",
      body: fd,
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json(); // {user, answer}
    conv.innerHTML += `<p class="user"><b>You:</b> ${data.user}</p>`;
    conv.innerHTML += `<p class="ai"><b>AI:</b> ${data.answer}</p>`;
    await speakText(data.answer);
    // Lặp lại nếu autoListening = true
    if (autoListening) await ai_conversation_loop();
    stat.textContent = "";
  } catch (err) {
    stat.textContent = "❌ " + err.message;
    autoListening = false;
  }
}

// Gắn sự kiện cho nút bắt đầu
btn.onclick = () => {
  if (!autoListening) {
    first = true;
    ai_conversation_loop();
  }
};
