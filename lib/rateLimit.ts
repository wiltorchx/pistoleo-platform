const rateMap = new Map<string, { count: number; timestamp: number }>();

export function rateLimit(key: string, limit = 5, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateMap.get(key);
  if (!record || now - record.timestamp > windowMs) {
    rateMap.set(key, { count: 1, timestamp: now });
    return true;
  }
  if (record.count >= limit) return false;
  record.count++;
  return true;
}

if (typeof global !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateMap.entries()) {
      if (now - record.timestamp > 15 * 60 * 1000) {
        rateMap.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}
