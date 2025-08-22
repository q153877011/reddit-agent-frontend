module.exports = {
  apps: [
    {
      name: 'ai-reddit-express',
      script: './bin/www',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm Z'
    },
    {
      name: 'ai-reddit-react',
      script: 'npm',
      args: 'run dev-server',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'development'
      },
      error_file: './logs/react-err.log',
      out_file: './logs/react-out.log',
      log_file: './logs/react-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm Z'
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