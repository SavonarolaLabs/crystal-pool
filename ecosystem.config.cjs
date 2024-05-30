module.exports = {
    apps: [{
      name: 'crystal-pool',
      script: 'src/server/server.ts',
      interpreter: 'bun',
      watch: ['src/server'],
      ignore_watch: ['node_modules'],
      autorestart: true,
      watch_delay: 1000,
      restart_delay: 1000
    }]
  };