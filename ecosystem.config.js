module.exports = {
  apps: [
    {
      name: "jobquip",
      script: "node_modules/.bin/next",
      args: "start -p 3000",
      cwd: "/home/admin/openclaw/workspace/jobs-platform",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        DATABASE_URL: "postgresql://jobquip:JQdb2024%21secure@localhost:5433/jobquip",
        JWT_SECRET: "your-jwt-secret-key-for-production-12345",
        KIMI_API_KEY: "sk-yBaN30XiLcyh4ZkVd7aLMukglXD6P9RSwC9nXCPhjQq3h3Ke",
        NEXTAUTH_SECRET: "your-nextauth-secret-key-for-production-12345",
        NEXTAUTH_URL: "https://jobquip.com",
        NEXT_PUBLIC_SITE_URL: "https://jobquip.com",
        ADZUNA_APP_ID: "2899dccd",
        ADZUNA_APP_KEY: "86ffc0dcf27cad6c95088854de203aed",
        CRON_SECRET: "26b8d084f251ae27be7c1083ec6251e6932e46c66230d39ed4f047f92db5480f",
      },
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "1G",
      autorestart: true,
      watch: false,
    },
  ],
};