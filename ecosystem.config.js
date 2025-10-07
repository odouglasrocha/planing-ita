module.exports = {
  apps: [{
    name: 'fabrica-ita-api',
    script: 'server.js',
    instances: 'max', // Usa todos os cores disponíveis
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
      VITE_API_URL: 'https://planing-ita.com',
      VITE_FRONTEND_URL: 'https://planing-ita.com',
      CORS_ORIGIN: 'https://planing-ita.com'
    },
    // Configurações de monitoramento
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    
    // Configurações de restart
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'dist'],
    max_restarts: 10,
    min_uptime: '10s',
    
    // Configurações de deploy
    post_update: ['npm install', 'npm run build:prod'],
    
    // Health check
    health_check_grace_period: 3000,
    health_check_fatal_exceptions: true
  }],

  deploy: {
    production: {
      user: 'deploy',
      host: 'planing-ita.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/fabrica-ita.git',
      path: '/var/www/fabrica-ita',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build:prod && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};