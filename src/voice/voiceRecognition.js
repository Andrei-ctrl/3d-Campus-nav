export function isVoiceRecognitionSupported() {
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function createVoiceRecognizer({
  language = 'en-US',
  onResult,
  onError,
  onStart,
  onEnd
} = {}) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = language;
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.addEventListener('start', () => {
    if (onStart) onStart();
  });

  recognition.addEventListener('end', () => {
    if (onEnd) onEnd();
  });

  recognition.addEventListener('error', (event) => {
    if (onError) onError(event);
  });

  recognition.addEventListener('result', (event) => {
    const result = event.results?.[0]?.[0];
    const transcript = result?.transcript?.trim();

    if (transcript && onResult) {
      onResult(transcript);
    }
  });

  return recognition;
}
