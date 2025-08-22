# PM2 部署指南

本项目已配置PM2进程管理器，用于生产环境部署和进程管理。

## 安装

PM2已作为开发依赖安装在项目中。如需全局安装：

```bash
npm install pm2 -g
```

## 配置文件

- `ecosystem.config.js` - PM2配置文件
- `logs/` - 日志文件目录

## 可用命令

### 本地开发

```bash
# 启动所有应用
npm run pm2:start

# 停止所有应用
npm run pm2:stop

# 重启所有应用
npm run pm2:restart

# 重载所有应用（零停机时间）
npm run pm2:reload

# 删除所有应用
npm run pm2:delete

# 查看日志
npm run pm2:logs

# 监控面板
npm run pm2:monit

# 查看状态
npm run pm2:status
```

### 生产环境

```bash
# 以生产模式启动
npm run pm2:prod
```

### 部署命令

```bash
# 初始化生产环境部署
npm run deploy:setup

# 部署到生产环境
npm run deploy:prod

# 部署到测试环境
npm run deploy:staging
```

## 应用配置

### ai-reddit-express (后端)
- **脚本**: `./bin/www`
- **端口**: 3000
- **实例数**: 1
- **内存限制**: 1GB
- **日志**: `logs/err.log`, `logs/out.log`, `logs/combined.log`

### ai-reddit-react (前端开发服务器)
- **脚本**: `npm run dev-server`
- **端口**: 3001
- **实例数**: 1
- **日志**: `logs/react-err.log`, `logs/react-out.log`, `logs/react-combined.log`

## 环境变量

### 开发环境
- `NODE_ENV=development`
- `PORT=3000`

### 生产环境
- `NODE_ENV=production`
- `PORT=3000`

## 部署配置

在使用部署功能前，请修改 `ecosystem.config.js` 中的以下配置：

1. **服务器信息**:
   - `user`: 服务器用户名
   - `host`: 服务器地址
   - `path`: 部署路径

2. **Git仓库**:
   - `repo`: Git仓库地址
   - `ref`: 分支名称

## 日志管理

所有日志文件存储在 `logs/` 目录中：

- `err.log` - 错误日志
- `out.log` - 输出日志
- `combined.log` - 合并日志
- `react-*.log` - React应用日志

## 监控

使用以下命令监控应用状态：

```bash
# 实时监控
npm run pm2:monit

# 查看进程状态
npm run pm2:status

# 查看实时日志
npm run pm2:logs
```

## 注意事项

1. 确保 `.env` 文件包含所有必要的环境变量
2. 生产环境部署前请先测试配置
3. 定期检查日志文件大小，必要时进行日志轮转
4. 部署前确保服务器已安装Node.js和PM2

## 故障排除

### 应用无法启动
1. 检查 `ecosystem.config.js` 配置
2. 查看错误日志：`npm run pm2:logs`
3. 确认端口未被占用
4. 检查环境变量配置

### 部署失败
1. 确认服务器SSH连接
2. 检查Git仓库访问权限
3. 确认服务器路径权限
4. 查看部署日志

更多信息请参考 [PM2官方文档](https://pm2.keymetrics.io/docs/)