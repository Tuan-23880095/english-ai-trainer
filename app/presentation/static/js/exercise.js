// app/presentation/static/js/exercise.js

let history = [];   // Lưu lịch sử hội thoại (ai/user)
let lastQuestion = ""; // Ghi lại câu hỏi AI mới nhất

// Xử lý voice-to-text
let recognition;
function startListening() {
    if (!('webkitSpeechRecognition' in window)) {
        alert('Trình duyệt không hỗ trợ speech-to-text!');
        return;
    }
    recognition = new webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        document.getElementById('inputText').value = transcript;
        addMessage('Bạn (speech)', transcript, 'en');
    };
    recognition.onerror = function(event) {
        alert('Lỗi nhận diện giọng nói: ' + event.error);
    }
    recognition.start();
}

// Thêm message vào chatbox
function addMessage(who, text, lang = 'en') {
    const chatbox = document.getElementById('chatbox');
    // Gắn nút nghe lại nếu có text
    const btnSpeak = text ? ` <button class="inline-tts-btn" onclick="window.speakMsg(\`${text.replace(/`/g, "\\`")}\`, '${lang}')">🔊</button>` : "";
    chatbox.innerHTML += `<b${lang === 'vi' ? ' style="color:#d32f2f"' : ''}>${who}:</b> ${text}${btnSpeak}<br>`;
    chatbox.scrollTop = chatbox.scrollHeight;
}

// Text-to-speech đa ngôn ngữ (EN/VI)
window.speakMsg = function(text, lang) {
    if (!text) return;
    if ('speechSynthesis' in window) {
        if (speechSynthesis.speaking) speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = (lang === 'vi') ? 'vi-VN' : 'en-US';
        window.speechSynthesis.speak(utter);
    } else {
        alert('Trình duyệt không hỗ trợ text-to-speech!');
    }
};

// Đọc lại nội dung ô nhập (dùng EN)
function speakText() {
    const text = document.getElementById('inputText').value;
    window.speakMsg(text, 'en');
}

// Gửi nội dung (nút Send)
async function sendMessage() {
    const input = document.getElementById('inputText').value.trim();
    if (!input) return;
    addMessage('You', input, 'en');
    history.push({ role: 'user', content: input });

    document.getElementById('inputText').value = '';
    document.getElementById('inputText').focus();

    // Gửi API /exercise/conversation lấy câu hỏi/góp ý mới
    const res = await fetch('/exercise/conversation', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history, input })
    });
    if (!res.ok) {
        addMessage('Hệ thống', "❌ Lỗi khi gửi API exercise.", 'vi');
        return;
    }
    const data = await res.json();

    // Góp ý tiếng Việt (feedback)
    if (data.feedback_vi) {
        addMessage('Góp ý', data.feedback_vi, 'vi');
    }

    // Từ vựng nên học (nếu có)
    if (Array.isArray(data.vocab) && data.vocab.length > 0) {
        data.vocab.forEach(v => {
            addVocabBlock(v);
        });
    }

    // Câu hỏi tiếp theo bằng tiếng Anh
    if (data.next_question) {
        addMessage('AI', data.next_question, 'en');
        history.push({ role: 'ai', content: data.next_question });
        lastQuestion = data.next_question;
    }
}

// Hiển thị từ vựng cần học (có thể có nhiều từ)
function addVocabBlock(v) {
    const chatbox = document.getElementById('chatbox');
    const html = `
    <div class="vocab-word" style="margin: 8px 0 14px 0; padding:10px 14px; background:#eefaff; border-radius:8px">
        <b>${v.word}</b> (<i>${v.meaning}</i>) <button onclick="window.speakMsg('${v.word}', 'en')">🔊</button><br>
        <span style="color:#29743c"><em>Example:</em></span> <i>${v.example}</i>
    </div>`;
    chatbox.innerHTML += html;
    chatbox.scrollTop = chatbox.scrollHeight;
}

// Sự kiện nút
document.getElementById('btn-voice').onclick = startListening;
document.getElementById('btn-tts').onclick = speakText;
document.getElementById('btn-send').onclick = sendMessage;

// --- Tự động hỏi câu đầu tiên khi load trang ---
window.addEventListener('DOMContentLoaded', async () => {
    if (history.length === 0) {
        // Nếu muốn cho phép chọn chủ đề, sửa lại role/system ở đây!
        const systemPrompt = "You are a friendly English tutor and you start the conversation. Please always answer concisely and shortly, no more than 2 sentences.";
        // Gọi ChatGPT sinh câu hỏi khởi động
        const res = await fetch('/exercise/conversation', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ history: [{role:"system", content: systemPrompt}], input: "" })
        });
        if (res.ok) {
            const data = await res.json();
            if (data.next_question) {
                addMessage('AI', data.next_question, 'en');
                history.push({ role: 'ai', content: data.next_question });
                lastQuestion = data.next_question;
            }
        }
    }
});
