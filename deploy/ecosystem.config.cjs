// PM2 processes for the VPS. Run from the repository root: pm2 start deploy/ecosystem.config.cjs
// Each app reads its own .env file (backend/.env, partners/.env.production); secrets never live here.
module.exports = {
  apps: [
    {
      name: 'mycaptain-api',
      cwd: './backend',
      script: 'dist/server.js',
      // One instance: live updates use in-process sockets. Scale out only with the Redis adapter.
      instances: 1,
      exec_mode: 'fork',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '400M',
      kill_timeout: 10000,
      time: true,
    },
    {
      name: 'mycaptain-partners',
      cwd: './partners',
      script: 'node_modules/next/dist/bin/next',
      // Port must match the Nginx site (deploy/nginx/mycaptain.conf). The API port is PORT in backend/.env.
      args: `start -p ${process.env.WEB_PORT || 3710} -H 127.0.0.1`,
      env: { NODE_ENV: 'production' },
      max_memory_restart: '500M',
      time: true,
    },
  ],
};
