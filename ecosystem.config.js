module.exports = {
  apps: [
    {
      name: 'ai-reddit-express-backend',
      script: './bin/www',
      instances: 1,
      autorestart: true,
      watch: ['routes', 'app.js', 'bin'],
      ignore_watch: ['node_modules', 'logs', 'src', 'dist'],
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/backend-err.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      kill_timeout: 5000,
      restart_delay: 1000
    },
    {
      name: 'ai-reddit-react-frontend',
      script: 'npm',
      args: 'run dev-server',
      instances: 1,
      autorestart: true,
      watch: ['src', 'webpack.config.js'],
      ignore_watch: ['node_modules', 'logs', 'routes', 'dist'],
      env: {
        NODE_ENV: 'development'
      },
      error_file: './logs/frontend-err.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      kill_timeout: 5000,
      restart_delay: 1000
    }
  ],

  deploy: {
    production: {
      user: 'node',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:username/ai-reddit-express.git',
      path: '/var/www/production',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    },
    staging: {
      user: 'node',
      host: 'staging-server.com',
      ref: 'origin/develop',
      repo: 'git@github.com:username/ai-reddit-express.git',
      path: '/var/www/staging',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': ''
    }
  }
};