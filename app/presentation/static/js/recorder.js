// app/presentation/static/js/recorder.js
async function submit(exId){
  const txt = document.getElementById(`answer-${exId}`).value
  const r = await fetch(`/exercise/${exId}/answer`,{
      method:'POST',
      body:new URLSearchParams({text:txt}),
      headers:{'Authorization':'Bearer '+localStorage.token}
  })
  const data = await r.json()
  document.getElementById(`feedback-${exId}`).innerText =
       `Score ${data.score}/10 — ${data.feedback}`
  speechSynthesis.speak(new SpeechSynthesisUtterance(data.feedback))
}
/*  static/js/recorder.js
    Ghi âm micro tới khi phát hiện 3s im lặng.
    Trả về Promise<Blob> (audio/webm)
*/
export async function startRecording() {
  // xin quyền mic
  const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
  const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
  const audioChunks   = [];

  // Phân tích âm lượng
  const audioCtx = new AudioContext();
  const source   = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);
  const pcmData = new Float32Array(analyser.fftSize);

  let silenceMs = 0;
  const SILENCE_THRESHOLD = 0.01;   // RMS < 1 %
  const MAX_SILENCE = 3000;         // 3 giây

  // hàm kiểm RMS & dừng khi im lặng đủ lâu
  const detectSilence = (time) => {
    analyser.getFloatTimeDomainData(pcmData);
    const rms = Math.sqrt(pcmData.reduce((s, v) => s + v * v, 0) / pcmData.length);

    if (rms < SILENCE_THRESHOLD) {
      silenceMs += 100;             // step = 100 ms
      if (silenceMs >= MAX_SILENCE && mediaRecorder.state === "recording") {
        mediaRecorder.stop();       // kết thúc
        return;                     // ngừng loop
      }
    } else {
      silenceMs = 0;                // reset nếu có tiếng
    }
    // lặp lại
    if (mediaRecorder.state === "recording")
      setTimeout(detectSilence, 100);
  };

  return new Promise((resolve) => {
    mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
    mediaRecorder.onstop = () => {
      audioCtx.close();           // giải phóng
      const blob = new Blob(audioChunks, { type: "audio/webm" });
      resolve(blob);
      stream.getTracks().forEach(t => t.stop());
    };
    mediaRecorder.start();
    detectSilence();              // kick-off vòng lặp RMS
  });
}
