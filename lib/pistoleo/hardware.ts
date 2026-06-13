export async function requestWakeLock() {
  if ('wakeLock' in navigator && (navigator as any).wakeLock) {
    try {
      const lock = await (navigator as any).wakeLock.request('screen');
      console.log('Wake Lock acquired');
      return lock;
    } catch (err) {
      console.error(`Wake Lock error: ${err}`, err);
    }
  }
  return null;
}

export function triggerHapticFeedback(type: 'success' | 'error' | 'warning') {
  if (!('vibrate' in navigator)) return;

  switch (type) {
    case 'success':
      navigator.vibrate(50); // Short pulse
      break;
    case 'warning':
      navigator.vibrate([50, 30, 50]); // Two short pulses
      break;
    case 'error':
      navigator.vibrate([100, 50, 100]); // Two long pulses
      break;
  }
}
