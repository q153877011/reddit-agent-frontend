var express = require('express');
var router = express.Router();

// 添加CORS中间件允许跨域请求
router.use((req, res, next) => {
  // 允许所有来源的跨域请求
  res.header('Access-Control-Allow-Origin', '*');
  // 允许的请求头
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  // 允许的HTTP方法
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

const Imap = require('node-imap');
const { simpleParser } = require('mailparser');


/* GET home page. */
router.get('/', async function(req, res, next) {
  try {
    const mail_list = await scanEmails();
    res.json({ 
      mailList: mail_list,
      contentType: req.get('Content-Type')
    });
  } catch (error) {
    console.error('扫描邮件时出错:', error);
    res.status(500).json({ 
      message: 'Error scanning emails', 
      error: error.message 
    });
  }
});

// 扫描邮件的异步函数
function scanEmails() {
  return new Promise((resolve, reject) => {
    const mail_list = [];
    
    // 配置 IMAP
    const imap = new Imap({
      user: 'venzilvenzil6@gmail.com',
      password: process.env.GMAIL_PASSWORD, // 使用应用专用密码
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });

    // 连接和获取邮件
    function openInbox(cb) {
      imap.openBox('INBOX', true, cb);
    }

    imap.once('ready', function() {
      openInbox(function(err, box) {
        if (err) {
          reject(err);
          return;
        }
        
        // 搜索未读邮件
        imap.search(['UNSEEN'], function(err, results) {
          if (err) {
            reject(err);
            return;
          }
          
          if (results.length === 0) {
            console.log('没有未读邮件');
            imap.end();
            resolve(mail_list);
            return;
          }
          
          const fetch = imap.fetch(results, {
            bodies: '',
            markSeen: false
          });
          
          let processedCount = 0;
          const totalMessages = results.length;
          
          fetch.on('message', function(msg, seqno) {
            msg.on('body', function(stream, info) {
              simpleParser(stream, (err, parsed) => {
                if (err) {
                  console.error('解析邮件出错:', err);
                  processedCount++;
                  if (processedCount === totalMessages) {
                    imap.end();
                    resolve(mail_list);
                  }
                  return;
                }
                
                if(!parsed.from.text.includes('F5Bot')) {
                  processedCount++;
                  if (processedCount === totalMessages) {
                    imap.end();
                    resolve(mail_list);
                  }
                  return;
                }
                
                // 匹配Reddit Posts后面的链接
                // 匹配格式: [0] Reddit Posts (/r/xxx/): 'title' [0] https://...
                const redditLinkMatch = parsed.text.match(/Reddit Posts[\s\S]*?\n\s*(https?:\/\/[^\s\n]+)/i);
                const receviedTime = parsed.date;
                const url = redditLinkMatch ? redditLinkMatch[1] : '';
                
                if (url) {
                  console.log('找到链接:', url);
                  mail_list.push({url, receviedTime});
                }
                
                processedCount++;
                if (processedCount === totalMessages) {
                  console.log('所有邮件处理完成，共找到', mail_list.length, '个链接');
                  imap.end();
                  resolve(mail_list);
                }
              });
            });
          });
          
          fetch.once('error', function(err) {
            console.error('获取邮件出错:', err);
            reject(err);
          });
        });
      });
    });

    imap.once('error', function(err) {
      console.log('IMAP错误:', err);
      reject(err);
    });

    imap.once('end', function() {
      console.log('IMAP连接已关闭');
    });

    imap.connect();
  });
}

module.exports = router;
