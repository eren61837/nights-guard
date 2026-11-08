module.exports = {
  apps: [
    {
      name: 'nights-guard',
      script: 'dist/index.js',
      cwd: 'c:\\Users\\dell\\Desktop\\discord-ai-architect',
      autorestart: true,
      restart_delay: 2000,
      max_restarts: 100,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
