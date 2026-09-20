import type { APIRoute } from 'astro';
import { verifyCredentials, createSessionToken, isAuthenticated, isAuthConfigured } from '../../../utils/admin-auth';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const authenticated = isAuthenticated(request);
  return new Response(JSON.stringify({ authenticated }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!isAuthConfigured()) {
      return new Response(
        JSON.stringify({ error: 'Trang quản trị chưa được cấu hình (thiếu ADMIN_USERNAME/ADMIN_PASSWORD/JWT_SECRET)' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { username, password } = body;

    if (!verifyCredentials(username, password)) {
      return new Response(JSON.stringify({ error: 'Tài khoản hoặc mật khẩu không chính xác' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = createSessionToken();
    if (!token) {
      return new Response(JSON.stringify({ error: 'Không thể tạo phiên đăng nhập' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const cookieHeader = `admin_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}`;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookieHeader,
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Yêu cầu không hợp lệ' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async () => {
  const cookieHeader = `admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookieHeader,
    },
  });
};
