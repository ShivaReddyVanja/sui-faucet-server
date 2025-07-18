module.exports = {
    apps: [
      {
        name: 'sui-faucet-backend',
        script: 'dist/index.js',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
          NODE_ENV: 'production',
          HOST: '0.0.0.0', // Bind to all interfaces
        },
      },
    ],
  };