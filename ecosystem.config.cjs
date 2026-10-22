module.exports = {
  apps: [
    {
      name: 'study-nest',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
