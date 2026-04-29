const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  ip: string,
  max: number,
  windowMs: number
): { success: boolean; resetAt: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  // Clean up expired entries for this IP and others
  if (record && now > record.resetAt) {
    rateLimitMap.delete(ip);
  }

  // Periodic cleanup: remove all expired entries (every 100 calls approximate)
  if (rateLimitMap.size > 1000) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (now > val.resetAt) {
        rateLimitMap.delete(key);
      }
    }
  }

  const current = rateLimitMap.get(ip);
  if (!current) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return { success: true, resetAt: now + windowMs };
  }

  if (current.count >= max) {
    return { success: false, resetAt: current.resetAt };
  }

  current.count++;
  return { success: true, resetAt: current.resetAt };
}

export function getClientIP(request: Request): string {
  // Try multiple real IP headers in order of reliability
  const headers = [
    "x-real-ip",
    "cf-connecting-ip",
    "x-client-ip",
    "x-forwarded-for",
  ];
  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      const ip = value.split(",")[0].trim();
      if (ip) return ip;
    }
  }
  return "unknown";
}
