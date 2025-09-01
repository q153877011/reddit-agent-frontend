require('dotenv').config();
const cors = require('cors');
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var itemRouter = require('./routes/item');
var answerRouter = require('./routes/answer');
var scanGmailRouter = require('./routes/scan-gmail');

// 启动邮件定时抓取服务
const emailCronJob = require('./services/emailCronJob');
emailCronJob.start();
console.log('邮件定时抓取服务已启动');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 托管前端构建文件
app.use(express.static(path.join(__dirname, 'dist')));

const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://9.134.53.93:3000',
    'http://127.0.0.1:3000',
    process.env.SERVER_BASE_URL
  ],
  // credentials: true, // 如果需要发送 cookies
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
};
// 添加全局CORS中间件允许跨域请求
// app.use((req, res, next) => {
//   // 允许特定来源的跨域请求（支持credentials）
//   res.header('Access-Control-Allow-Origin', 'http://localhost:3001');
//   // 允许发送凭据
//   res.header('Access-Control-Allow-Credentials', 'true');
//   // 允许的请求头
//   res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
//   // 允许的HTTP方法
//   res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
//   // 处理预检请求
//   if (req.method === 'OPTIONS') {
//     res.sendStatus(200);
//   } else {
//     next();
//   }
// });

app.use(cors(corsOptions));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/item', itemRouter);
app.use('/answer', answerRouter);
app.use('/scan-gmail', scanGmailRouter);

// SPA回退路由 - 对于非API请求，返回index.html
app.get('*', (req, res) => {
  // 如果请求的是API路径，继续404处理
  if (req.path.startsWith('/api/') || req.path.startsWith('/users') || req.path.startsWith('/item') || req.path.startsWith('/answer') || req.path.startsWith('/scan-gmail')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  // 否则返回前端应用
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
