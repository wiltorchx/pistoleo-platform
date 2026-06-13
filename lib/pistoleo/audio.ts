export const playScanSound = (type: 'success' | 'over' | 'unknown') => {
  const sounds = {
    success: '/sounds/correcto.wav',
    over: '/sounds/exceso.wav',
    unknown: '/sounds/fuera.wav',
  };

  const audio = new Audio(sounds[type]);
  audio.play().catch(e => console.warn('Audio playback failed. Ensure files exist in public/sounds/', e));
};

export const playBeep = (frequency = 440, duration = 0.1) => {
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) {
    console.warn('AudioContext not supported');
    return;
  }
  const audioCtx = new AudioContextClass();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.frequency.value = frequency;
  gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

  oscillator.start();
  setTimeout(() => {
    oscillator.stop();
    audioCtx.close();
  }, duration * 1000);
};
