// PM2 进程管理配置
module.exports = {
  apps: [
    {
      name: 're-museum',
      script: 'server.mjs',
      instances: 1,                // 单实例即可（轻量应用）
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_file: '.env',            // 自动加载 .env 文件
      max_memory_restart: '300M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      merge_logs: true,
    },
  ],
};
