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
let sessionId = null;

// Hàm lấy headers cho mọi fetch hội thoại, luôn có session_id
function getVoiceHeaders(isJson = false) {
    const headers = {
        ...getAuthHeaders(),
        "x-session-id": sessionId
    };
    if (isJson) headers["Content-Type"] = "application/json";
    return headers;
}

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
    stat.textContent = "💤 Kết thúc hội thoại (user im lặng >30s)";
}
async function fetchKeywords(conversation) {
    const res = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation })
    });
    const data = await res.json();
    return data.keywords || [];
}
async function updateKeywords() {
    // Lấy toàn bộ hội thoại dưới dạng text
    let text = [...document.querySelectorAll("#conversation p")]
        .map(p => p.textContent)
        .join("\n")
        .trim();

    // Nếu chưa có hội thoại, không gọi API
    if (!text) {
        document.getElementById('keywords').innerHTML = "<em>Chưa có hội thoại để trích xuất từ vựng.</em>";
        return;
    }

    // Gọi API lấy từ khóa
    const keywords = await fetchKeywords(text);

    // Tạo HTML hiển thị từ vựng
    let html = '';
    if (keywords.length === 0) {
        html = "<em>Không tìm thấy từ vựng nổi bật trong hội thoại này.</em>";
    } else {
        for (const k of keywords) {
            html += `
                <div class="vocab-word">
                    <b>${k.word}</b> <i>/${k.ipa}/</i><br>
                    <span>${k.meaning}</span><br>
                    <audio src="${k.voice}" controls></audio><br>
                    <em>Ví dụ:</em> ${k.example}
                    <hr>
                </div>
            `;
        }
    }
    document.getElementById('keywords').innerHTML = html;
}

async function ai_conversation_loop() {
    if (!sessionActive) return;
    if (first) {
        stat.textContent = "Đang hỏi AI khởi động...";
        try {
            const res = await fetch("/api/voice", {
                method: "POST",
                headers: getVoiceHeaders(true), // truyền session_id + Content-Type
                body: JSON.stringify({ prompt: "You are a friendly English tutor (you can use Vietnamese if needed) and you start the conversation. Please always answer concisely and shortly, no more than 2 sentences." })
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            conv.innerHTML += `<p class="ai"><b>AI:</b> ${data.answer}</p>`;
            // Lấy lại session_id từ response nếu backend sinh mới (optional)
            if (data.session_id) sessionId = data.session_id;
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
            headers: getVoiceHeaders() // chỉ truyền session_id, không cần Content-Type
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        conv.innerHTML += `<p class="user"><b>You:</b> ${data.user}</p>`;
        conv.innerHTML += `<p class="ai"><b>AI:</b> ${data.answer}</p>`;
        if (data.session_id) sessionId = data.session_id; // luôn cập nhật lại nếu backend trả về
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
        // Sinh sessionId mới khi bắt đầu hội thoại mới
        sessionId = (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString());
        first = true;
        sessionActive = true;
        ai_conversation_loop();
    }
};
