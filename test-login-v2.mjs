import dotenv from 'dotenv';
dotenv.config({ path: '.env.production' });

// 获取 CSRF token
const csrfRes = await fetch('https://jobquip.com/api/auth/csrf');
const csrfData = await csrfRes.json();
const csrfToken = csrfData.csrfToken;

console.log('CSRF Token:', csrfToken);

// 获取 Set-Cookie header
const setCookie = csrfRes.headers.get('set-cookie');
console.log('Set-Cookie:', setCookie);

// 尝试登录（使用正确的 Cookie）
const loginRes = await fetch('https://jobquip.com/api/auth/callback/credentials', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Cookie': setCookie || `next-auth.csrf-token=${csrfToken}`,
  },
  body: `email=admin%40example.com&password=Admin%402026%21&csrfToken=${csrfToken}&json=true`,
  redirect: 'manual',
});

console.log('\n登录状态码:', loginRes.status);
console.log('Location:', loginRes.headers.get('location'));

const text = await loginRes.text();
console.log('响应体:', text.substring(0, 500));
