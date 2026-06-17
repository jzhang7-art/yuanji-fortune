// pm2 启动配置。部署到 VPS 后：
//   1. cp server/ecosystem.config.cjs /opt/invite-api/
//   2. echo "INVITE_SECRET=..." | sudo tee /etc/invite-api.env && sudo chmod 600 /etc/invite-api.env
//   3. cd /opt/invite-api && pm2 start ecosystem.config.cjs
//   4. pm2 save && pm2 startup
module.exports = {
  apps: [
    {
      name: 'invite-api',
      script: 'server/invite-server.mjs',
      cwd: '/opt/invite-api',
      env_file: '/etc/invite-api.env',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '128M',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      out_file: '/var/log/invite-api.out.log',
      error_file: '/var/log/invite-api.err.log',
      merge_logs: true,
      time: true,
    },
  ],
}
