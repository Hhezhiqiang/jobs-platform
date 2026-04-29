import dotenv from 'dotenv';
dotenv.config({ path: '.env.production' });

// 1. 获取 CSRF token
const csrfRes = await fetch('https://jobquip.com/api/auth/csrf');
const csrfData = await csrfRes.json();
console.log('CSRF Token:', csrfData.csrfToken ? '获取成功' : '获取失败');
console.log('CSRF:', csrfData.csrfToken?.substring(0, 20) + '...');

// 2. 尝试登录
const loginRes = await fetch('https://jobquip.com/api/auth/callback/credentials', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Cookie': `next-auth.csrf-token=${csrfData.csrfToken}`,
  },
  body: new URLSearchParams({
    email: 'admin@example.com',
    password: 'Admin@2026!',
    csrfToken: csrfData.csrfToken,
    json: 'true',
  }),
  redirect: 'manual',
});

console.log('\n登录状态码:', loginRes.status);
console.log('响应头 Location:', loginRes.headers.get('location'));

const text = await loginRes.text();
console.log('响应体:', text.substring(0, 300));
