const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  ip: string,
  max: number,
  windowMs: number
): { success: boolean; resetAt: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return { success: true, resetAt: now + windowMs };
  }

  if (record.count >= max) {
    return { success: false, resetAt: record.resetAt };
  }

  record.count++;
  return { success: true, resetAt: record.resetAt };
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "unknown";
}
