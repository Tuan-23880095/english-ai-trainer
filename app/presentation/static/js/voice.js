import { startRecording, resetSessionTimeout, stopSessionTimeout } from "/static/js/recorder.js";

let isSpeaking = false; // Đánh dấu trạng thái AI đang nói

function speakText(text) {
    return new Promise(resolve => {
        if (speechSynthesis.speaking) speechSynthesis.cancel();
        let utter = new SpeechSynthesisUtterance(text);
        utter.lang = "en-US";
        isSpeaking = true;
        document.getElementById("start").disabled = true;
        utter.onend = () => {
            isSpeaking = false;
            document.getElementById("start").disabled = false;
            resolve();
        };
        speechSynthesis.speak(utter);
    });
}

// Lấy header xác thực user
function getAuthHeaders() {
    const email = sessionStorage.getItem("email");
    const password = sessionStorage.getItem("password");
    return { "x-email": email, "x-password": password };
}

// Các biến tham chiếu giao diện
const btn = document.getElementById("start");
const stat = document.getElementById("status");
const conv = document.getElementById("conversation");

// Thêm tham chiếu nút gợi ý từ vựng từ DB (phải có trong HTML)
const btnRefreshKeywords = document.getElementById("refresh-keywords");

let first = true;
let sessionActive = false;
let sessionId = null;

// Hàm lấy headers cho hội thoại (luôn có session_id)
function getVoiceHeaders(isJson = false) {
    const headers = {
        ...getAuthHeaders(),
        "x-session-id": sessionId
    };
    if (isJson) headers["Content-Type"] = "application/json";
    return headers;
}

// Hàm chỉ cho ghi âm khi AI đã nói xong
async function tryStartRecording() {
    if (isSpeaking) return; // Không ghi nếu AI đang nói
    await startRecording();
}

function endSession() {
    sessionActive = false;
    stopSessionTimeout();
    stat.textContent = "💤 Kết thúc hội thoại (user im lặng >30s)";
}

// --------- TỪ VỰNG NỔI BẬT ----------

// API lấy keywords theo hội thoại đang hiển thị
async function fetchKeywords(conversation) {
    const res = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation })
    });
    const data = await res.json();
    return data.keywords || [];
}

// API lấy keywords từ DB (hội thoại gần nhất)
async function fetchKeywordsFromDB() {
    const res = await fetch("/api/keywords_from_db", {
        headers: getAuthHeaders()
    });
    const data = await res.json();
    return data.keywords || [];
}

// Hàm render lại khung từ vựng
function renderKeywords(keywords) {
    let html = '';
    if (!keywords || keywords.length === 0) {
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

    // Sự kiện cho nút Lưu từ và Phát âm
    document.querySelectorAll('.save-word-btn').forEach(btn => {
        btn.onclick = function() {
            alert("Đã lưu từ: " + btn.dataset.word);
        }
    });
    document.querySelectorAll('.play-word-btn').forEach(btn => {
        btn.onclick = function() {
            let audio = new Audio(btn.dataset.voice);
            audio.play();
        }
    });
}

// update theo hội thoại hiện tại trên giao diện
async function updateKeywords() {
    let text = [...document.querySelectorAll("#conversation p")]
        .map(p => p.textContent)
        .join("\n")
        .trim();
    if (!text) {
        renderKeywords([]);
        return;
    }
    const keywords = await fetchKeywords(text);
    renderKeywords(keywords);
}

// Sự kiện khi bấm "Gợi ý từ DB"
if (btnRefreshKeywords) {
    btnRefreshKeywords.onclick = async () => {
        document.getElementById('keywords').innerHTML = "<em>Đang lấy từ vựng từ lịch sử gần nhất...</em>";
        const keywords = await fetchKeywordsFromDB();
        renderKeywords(keywords);
    };
}

// --------- VÒNG LẶP HỘI THOẠI AI ---------
async function ai_conversation_loop() {
    if (!sessionActive) return;
    if (first) {
        stat.textContent = "Đang hỏi AI khởi động...";
        try {
            const res = await fetch("/api/voice", {
                method: "POST",
                headers: getVoiceHeaders(true),
                body: JSON.stringify({ prompt: "You are a friendly English tutor   and you start the conversation. Please always answer concisely and shortly, no more than 2 sentences." })
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            conv.innerHTML += `<p class="ai"><b>AI:</b> ${data.answer}</p>`;
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
    await tryStartRecording();
    if (!sessionActive) return;
    stat.textContent = "⏳ Đang xử lý...";
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
            headers: getVoiceHeaders()
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        conv.innerHTML += `<p class="user"><b>You:</b> ${data.user}</p>`;
        conv.innerHTML += `<p class="ai"><b>AI:</b> ${data.answer}</p>`;
        if (data.session_id) sessionId = data.session_id;
        await speakText(data.answer);
        if (sessionActive) {
            resetSessionTimeout(endSession);
            await ai_conversation_loop();
        }
        stat.textContent = "";
        await updateKeywords();
    } catch (err) {
        stat.textContent = "❌ " + err.message;
        sessionActive = false;
    }
}

// Gán cho nút bắt đầu nói
btn.onclick = () => {
    if (!sessionActive) {
        sessionId = (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString());
        first = true;
        sessionActive = true;
        ai_conversation_loop();
    }
};
