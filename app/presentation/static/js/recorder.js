// app/presentation/static/js/recorder.js

const MAX_SILENCE = 6000;      // 5 giây: user im lặng >5s thì kết thúc ghi câu
const SESSION_TIMEOUT = 40000; // 20 giây: user im lặng >20s thì end hội thoại

let sessionTimeout;

// Hàm ghi âm 1 lượt, trả về blob khi user im lặng > MAX_SILENCE
export async function startRecording() {
    if (!navigator.mediaDevices) {
        alert("Trình duyệt không hỗ trợ ghi âm!");
        throw new Error("No mediaDevices");
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return new Promise((resolve, reject) => {
        try {
            let recorder = new MediaRecorder(stream);
            let chunks = [];
            recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

            recorder.onstop = () => {
                stream.getTracks().forEach(track => track.stop());
                let blob = new Blob(chunks, { type: "audio/webm" });
                resolve(blob);
            };

            // Xử lý phát hiện im lặng
            const audioCtx = new AudioContext();
            const src = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            src.connect(analyser);

            let silenceMs = 0;
            function checkSilence() {
                let data = new Uint8Array(analyser.fftSize);
                analyser.getByteTimeDomainData(data);
                let max = Math.max(...data);
                let min = Math.min(...data);
                let vol = max - min;
                if (vol < 4) silenceMs += 200;
                else silenceMs = 0;
                if (silenceMs >= MAX_SILENCE) {
                    recorder.stop();
                    audioCtx.close();
                }
                else setTimeout(checkSilence, 200);
            }

            // Cho micro kịp ready trước khi ghi (tránh mất tiếng đầu)
            setTimeout(() => {
                recorder.start();
                checkSilence();
            }, 400); // Có thể điều chỉnh 350~500ms tùy máy

        } catch (err) {
            reject(err);
        }
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
