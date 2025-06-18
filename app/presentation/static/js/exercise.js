// app/presentation/static/js/exercise.js

// Hàm tiện ích lấy header xác thực
function getAuthHeaders() {
  const email = sessionStorage.getItem("email");
  const password = sessionStorage.getItem("password");
  return { "x-email": email, "x-password": password };
}

// Hàm nộp bài cho từng bài tập
window.submit = async function(exId) {
  const answer = document.getElementById(`answer-${exId}`).value.trim();
  if (!answer) {
    document.getElementById(`feedback-${exId}`).innerText = "Bạn chưa nhập câu trả lời!";
    return;
  }
  document.getElementById(`feedback-${exId}`).innerText = "Đang chấm...";

  try {
    // Gửi kèm header xác thực khi nộp bài
    const res = await fetch(`/exercise/${exId}/answer`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({ text: answer })
    });
    if (!res.ok) {
      if (res.status === 401) {
        sessionStorage.clear();
        location.href = "/";
        return;
      }
      throw new Error(await res.text());
    }
    const data = await res.json();
    document.getElementById(`feedback-${exId}`).innerText =
      `Score: ${data.score}/10\n${data.feedback}`;
    // Đọc feedback bằng TTS (nếu muốn)
    if (data.feedback) {
      const u = new SpeechSynthesisUtterance(data.feedback);
      u.lang = "en-US";
      speechSynthesis.speak(u);
    }
  } catch (err) {
    document.getElementById(`feedback-${exId}`).innerText = "❌ " + err.message;
  }
};
