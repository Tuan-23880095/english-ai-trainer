// app/presentation/static/js/recorder.js
// /static/js/recorder.js

const MAX_SILENCE = 6000;    // 6 giây: user im lặng >3s thì kết thúc ghi câu
const SESSION_TIMEOUT = 30000; // 40 giây: user im lặng >30s thì end hội thoại

let sessionTimeout;

// Hàm ghi âm 1 lượt, trả về blob khi user im lặng >6s
export function startRecording() {
    return new Promise(async (resolve, reject) => {
        if (!navigator.mediaDevices) return reject("Trình duyệt không hỗ trợ ghi âm!");
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        let chunks = [];
        recorder.ondataavailable = e => chunks.push(e.data);

        recorder.onstop = () => {
            stream.getTracks().forEach(track => track.stop());
            resolve(new Blob(chunks, { type: 'audio/webm' }));
        };

        // Phát hiện im lặng để tự động stop
        const audioCtx = new AudioContext();
        const src = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        src.connect(analyser);

        let silenceMs = 0, lastVol = 1000;
        function checkSilence() {
            let data = new Uint8Array(analyser.fftSize);
            analyser.getByteTimeDomainData(data);
            let max = Math.max(...data);
            let min = Math.min(...data);
            let vol = max - min;
            if (vol < 8) silenceMs += 200;
            else silenceMs = 0;
            if (silenceMs >= MAX_SILENCE) recorder.stop();
            else setTimeout(checkSilence, 200);
        }

        recorder.start();
        checkSilence();
    });
}

// Reset lại session timeout (gọi khi AI trả lời hoặc user vừa nói xong)
export function resetSessionTimeout(onEndSession) {
    if (sessionTimeout) clearTimeout(sessionTimeout);
    sessionTimeout = setTimeout(() => {
        if (onEndSession) onEndSession();
    }, SESSION_TIMEOUT);
}

export function stopSessionTimeout() {
    if (sessionTimeout) clearTimeout(sessionTimeout);
    sessionTimeout = null;
}

