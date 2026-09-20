import crypto from 'node:crypto';

/**
 * Thông tin đăng nhập admin được đọc từ biến môi trường.
 * KHÔNG hardcode secret trong source — repo này là public.
 * Nếu thiếu cấu hình, mọi yêu cầu đăng nhập sẽ bị từ chối.
 */
type AdminConfig = { username: string; password: string; secret: string };

function getConfig(): AdminConfig | null {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.JWT_SECRET;
  if (!username || !password || !secret) return null;
  return { username, password, secret };
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

export function isAuthConfigured(): boolean {
  return getConfig() !== null;
}

export function verifyCredentials(username?: string, password?: string): boolean {
  const config = getConfig();
  if (!config || !username || !password) return false;
  return safeEqual(username, config.username) && safeEqual(password, config.password);
}

export function createSessionToken(): string | null {
  const config = getConfig();
  if (!config) return null;
  const payload = `${Date.now()}:admin`;
  const signature = crypto.createHmac('sha256', config.secret).update(payload).digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64');
}

export function verifySessionToken(token: string | null | undefined): boolean {
  const config = getConfig();
  if (!config || !token) return false;
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [timestampStr, role, signature] = decoded.split(':');
    if (role !== 'admin' || !timestampStr || !signature) return false;

    const timestamp = parseInt(timestampStr, 10);
    // Token hạn dùng 7 ngày
    if (Date.now() - timestamp > 7 * 24 * 60 * 60 * 1000) return false;

    const expectedSignature = crypto
      .createHmac('sha256', config.secret)
      .update(`${timestampStr}:${role}`)
      .digest('hex');

    return safeEqual(signature, expectedSignature);
  } catch {
    return false;
  }
}

export function getSessionFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [k, ...v] = c.trim().split('=');
      return [k, v.join('=')];
    })
  );
  return cookies['admin_session'] || null;
}

export function isAuthenticated(request: Request): boolean {
  const token = getSessionFromRequest(request);
  return verifySessionToken(token);
}
