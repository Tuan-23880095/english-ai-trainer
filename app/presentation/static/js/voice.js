// /static/js/voice.js
import { startRecording, resetSessionTimeout, stopSessionTimeout } from "/static/js/recorder.js";

function getAuthHeaders() {
    const email = sessionStorage.getItem("email");
    const password = sessionStorage.getItem("password");
    return { "x-email": email, "x-password": password };
}

const btn = document.getElementById("start");
const stat = document.getElementById("status");
const conv = document.getElementById("conversation");

let first = true;
let sessionActive = false;

function speakText(text) {
    return new Promise(resolve => {
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = "en-US";
        utter.onend = resolve;
        speechSynthesis.speak(utter);
    });
}

function endSession() {
    sessionActive = false;
    stopSessionTimeout();
    stat.textContent = "💤 Kết thúc hội thoại (user im lặng >10s)";
}

async function ai_conversation_loop() {
    if (!sessionActive) return;
    if (first) {
        stat.textContent = "Đang hỏi AI khởi động...";
        try {
            const res = await fetch("/api/voice", {
                method: "POST",
                headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: "Bạn hãy bắt đầu huấn luyện tiếng anh" })
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            conv.innerHTML += `<p class="ai"><b>AI:</b> ${data.answer}</p>`;
            await speakText(data.answer);
            first = false;
            resetSessionTimeout(endSession);
            await ai_conversation_loop();
        } catch (err) {
            stat.textContent = "❌ " + err.message;
            sessionActive = false;
        }
        return;
    }
    stat.textContent = "🎤 Đang nghe...";
    resetSessionTimeout(endSession);
    const blob = await startRecording();
    if (!sessionActive) return;
    stat.textContent = "⏳ Đang xử lý...";
    resetSessionTimeout(endSession);
    const fd = new FormData();
    fd.append("file", blob, "audio.webm");
    try {
        const res = await fetch("/api/voice", {
            method: "POST",
            body: fd,
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        conv.innerHTML += `<p class="user"><b>You:</b> ${data.user}</p>`;
        conv.innerHTML += `<p class="ai"><b>AI:</b> ${data.answer}</p>`;
        await speakText(data.answer);
        if (sessionActive) {
            resetSessionTimeout(endSession);
            await ai_conversation_loop();
        }
        stat.textContent = "";
    } catch (err) {
        stat.textContent = "❌ " + err.message;
        sessionActive = false;
    }
}

btn.onclick = () => {
    if (!sessionActive) {
        first = true;
        sessionActive = true;
        ai_conversation_loop();
    }
};
