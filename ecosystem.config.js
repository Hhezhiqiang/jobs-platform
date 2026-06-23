// Production process config for PM2.
// Secrets are loaded from .env.production (Next.js auto-loads it when NODE_ENV=production).
// Do NOT add secrets here — keep this file safe to commit.
module.exports = {
  apps: [
    {
      name: "jobquip",
      cwd: "/opt/jobs-platform",
      script: "node_modules/.bin/next",
      args: "start -p 3000",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      // Signal hardening: avoid the rapid restart storms we saw when PM2 wrapped npm.
      kill_timeout: 5000,
      wait_ready: false,
      min_uptime: "30s",
      max_restarts: 5,
      restart_delay: 2000,
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
  ],
};
