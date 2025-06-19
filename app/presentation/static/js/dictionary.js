// app/presentation/static/js/dictionary.js

function getAuthHeaders() {
  const email = sessionStorage.getItem("email");
  const password = sessionStorage.getItem("password");
  return { "x-email": email, "x-password": password };
}

(() => {
  const input   = document.getElementById("word");
  const btn     = document.getElementById("lookup");
  const result  = document.getElementById("result");
  const btnSpeak= document.getElementById("speak-word");

  let lastAudioUrl = null;

  // Nhấn Enter cũng tra cứu
  input.addEventListener("keyup", e => { if (e.key === "Enter") btn.click(); });

  btn.addEventListener("click", async () => {
    const word = input.value.trim();
    if (!word) return;

    result.textContent = "Đang tra…";
    btnSpeak.disabled = true;

    try {
      const r  = await fetch(`/api/dictionary/${encodeURIComponent(word)}`, {
        headers: getAuthHeaders()
      });
      if (!r.ok) throw new Error(await r.text());
      const js = await r.json(); // Xem API bên dưới
      render(js);
      // Chuẩn bị phát âm nếu có link
      if (js.voice_url) {
        lastAudioUrl = js.voice_url;
        btnSpeak.disabled = false;
      } else {
        lastAudioUrl = null;
        btnSpeak.disabled = true;
      }
    } catch (err) {
      if (err.message.includes("401")) {
        sessionStorage.clear();
        location.href = "/";
      } else {
        result.textContent = "❌ " + err.message;
      }
    }
  });

  function render(data) {
    let html = `• <b>${data.word}</b>  <i>/${data.phonetic || ""}/</i>\n`;
    html += `<b>Loại từ:</b> ${data.word_type || "—"}\n`;
    html += `<b>Nghĩa:</b> ${data.meaning}\n`;
    if (data.family_words && data.family_words.length > 0) {
      html += `<b>Gia đình từ:</b> ${data.family_words.map(f => `<b>${f.word}</b> (${f.type}): ${f.meaning}`).join("; ")}\n`;
    }
    html += `<b>Ví dụ:</b> ${data.example || "—"}`;
    result.innerHTML = html.replace(/\n/g, "<br>");
  }

  // Phát âm từ bằng audio gốc hoặc TTS fallback
  btnSpeak.addEventListener("click", () => {
    if (lastAudioUrl) {
      const audio = new Audio(lastAudioUrl);
      audio.play();
    } else {
      // fallback: đọc từ bằng TTS
      const word = input.value.trim();
      if (word) {
        const u = new SpeechSynthesisUtterance(word);
        u.lang = "en-US";
        speechSynthesis.speak(u);
      }
    }
  });
})();
