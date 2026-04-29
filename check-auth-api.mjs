import dotenv from 'dotenv';
dotenv.config({ path: '.env.production' });

// 模拟登录请求
const email = 'admin@example.com';
const password = 'Admin@2026!';

try {
  const res = await fetch('https://jobquip.com/api/auth/callback/credentials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
    redirect: 'manual',
  });
  
  console.log('状态码:', res.status);
  console.log('响应头:', Object.fromEntries(res.headers.entries()));
  
  const text = await res.text();
  console.log('响应体:', text.substring(0, 200));
} catch (e) {
  console.error('请求错误:', e.message);
}
