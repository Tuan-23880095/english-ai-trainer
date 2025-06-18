// /static/js/voice.js
let isSpeaking = false; // Đánh dấu trạng thái AI đang nói
function speakText(text) {
    return new Promise(resolve => {
        if (speechSynthesis.speaking) speechSynthesis.cancel();
        let utter = new SpeechSynthesisUtterance(text);
        utter.lang = "en-US";
        isSpeaking = true;
        // Disable nút "Bắt đầu thực hành nói"
        document.getElementById("start").disabled = true;
        utter.onend = () => {
            isSpeaking = false;
            document.getElementById("start").disabled = false;
            resolve();
        };
        speechSynthesis.speak(utter);
    });
}

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
    let text = [...document.querySelectorAll("#conversation p")]
        .map(p => p.textContent)
        .join("\n")
        .trim();

    if (!text) {
        document.getElementById('keywords').innerHTML = "<em>Chưa có hội thoại để trích xuất từ vựng.</em>";
        return;
    }

    const keywords = await fetchKeywords(text);

    let html = '';
    if (keywords.length === 0) {
        html = "<em>Không tìm thấy từ vựng nổi bật trong hội thoại này.</em>";
    } else {
        for (const k of keywords) {
            html += `
                <div class="vocab-word" title="Nhấn vào để lưu từ này">
                    <div style="display:flex; align-items:center; gap:0.6em;">
                        <b>${k.word}</b>
                        <i>/${k.ipa}/</i>
                        <button class="save-word-btn" data-word="${k.word}" title="Lưu từ vựng">
                            <span style="color:#0066cc;">☆</span>
                        </button>
                        <button class="play-word-btn" data-voice="${k.voice}" title="Nghe phát âm">
                            <span style="color:#4b2;">🔊</span>
                        </button>
                    </div>
                    <span class="meaning" style="color:#29743c;font-weight:500;" title="Nghĩa tiếng Việt">${k.meaning}</span><br>
                    <em>Ví dụ:</em> <span title="Câu ví dụ">${k.example}</span>
                    <hr>
                </div>
            `;
        }
    }
    document.getElementById('keywords').innerHTML = html;

    // Gán sự kiện cho nút "Lưu từ" và "Phát âm" sau khi render html
    document.querySelectorAll('.save-word-btn').forEach(btn => {
        btn.onclick = function() {
            alert("Đã lưu từ: " + btn.dataset.word);
            // ...hoặc xử lý lưu thực tế vào localStorage/database...
        }
    });
    document.querySelectorAll('.play-word-btn').forEach(btn => {
        btn.onclick = function() {
            let audio = new Audio(btn.dataset.voice);
            audio.play();
        }
    });
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
