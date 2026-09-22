import { useState, useRef, useCallback } from 'react';

export function useVoice(onTranscript) {
  const [isRecording, setIsRecording] = useState(false);
  const [supported] = useState(() => !!(window.SpeechRecognition || window.webkitSpeechRecognition));
  const recRef = useRef(null);

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-IN';
    rec.onresult = (e) => {
      let final = '', interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      onTranscript(final, interim);
    };
    rec.onend = () => { if (recRef.current) rec.start(); };
    rec.onerror = () => stop();
    rec.start();
    recRef.current = rec;
    setIsRecording(true);
  }, [onTranscript]);

  const stop = useCallback(() => {
    if (recRef.current) { try { recRef.current.stop(); } catch(e) {} recRef.current = null; }
    setIsRecording(false);
  }, []);

  const toggle = useCallback(() => { isRecording ? stop() : start(); }, [isRecording, start, stop]);

  return { isRecording, supported, toggle, stop };
}
