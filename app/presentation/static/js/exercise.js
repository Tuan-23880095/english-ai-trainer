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
        addMessage('Bạn (speech)', transcript);
    };
    recognition.onerror = function(event) {
        alert('Lỗi nhận diện giọng nói: ' + event.error);
    }
    recognition.start();
}

function addMessage(who, text) {
    const block = document.getElementById('feedback-block');
    block.innerHTML += `<b>${who}:</b> ${text}<br>`;
    block.scrollTop = block.scrollHeight;
}

// Đọc lại
function speakText() {
    const text = document.getElementById('inputText').value;
    if (text) speak(text);
}
function speak(text) {
    if ('speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'en-US';
        window.speechSynthesis.speak(utter);
    } else {
        alert('Trình duyệt không hỗ trợ text-to-speech!');
    }
}

// Gửi bài cho AI backend chấm điểm
async function submitAnswer() {
    const answer = document.getElementById('inputText').value.trim();
    if (!answer) {
        alert("Bạn chưa nhập câu trả lời!");
        return;
    }
    document.getElementById('feedback-block').innerHTML = "<i>Đang chấm điểm...</i>";
    // Lấy exercise_id từ template context (giả sử có id trong exercise)
    const ex_id = window.exerciseId || 1;
    // Gửi lên backend chấm điểm
    const res = await fetch(`/exercise/${ex_id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer })
    });
    if (!res.ok) {
        document.getElementById('feedback-block').innerHTML = "<span style='color:red'>Có lỗi khi chấm bài!</span>";
        return;
    }
    const data = await res.json();
    let fb = `<div style="background:#fff; border-radius:7px; padding:14px 12px; border:1px solid #b6e1fd;">
        <b>Điểm:</b> <span style="color:#2196f3;">${data.score}/10</span><br>
        <b>Nhận xét:</b> ${data.feedback} <button onclick="speakTextAI('${data.feedback.replace(/'/g,"\\'")}')">🔊</button><br>
        <b>Câu mẫu:</b> <i>${data.model_answer || ""}</i>
        </div>`;
    document.getElementById('feedback-block').innerHTML = fb;
}
window.speakTextAI = function(txt) { speak(txt); }

document.getElementById('btn-voice').onclick = startListening;
document.getElementById('btn-tts').onclick = speakText;
document.getElementById('btn-submit').onclick = submitAnswer;
