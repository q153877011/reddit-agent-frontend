const cron = require('node-cron');
const mysql = require('mysql2/promise');

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'edgeone',
  charset: 'utf8mb4'
};

const Imap = require('node-imap');
const { simpleParser } = require('mailparser');

// 插入数据到数据库的函数（带去重检查）
async function insertCrawlMessage(url, date) {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // 先检查URL是否已存在
    const [existing] = await connection.execute(
      'SELECT id FROM crawl_message WHERE url = ?',
      [url]
    );
    
    if (existing.length > 0) {
      console.log('URL已存在，跳过插入:', url);
      return existing[0].id;
    }
    
    // 如果不存在，则插入新记录
    const [result] = await connection.execute(
      'INSERT INTO crawl_message (`from`, url, date) VALUES (?, ?, ?)',
      ['f5bot', url, date]
    );
    console.log('数据插入成功，ID:', result.insertId);
    return result.insertId;
  } catch (error) {
    console.error('数据库插入失败:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

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
                const redditLinkMatch = parsed.text.match(/Reddit Posts[\s\S]*?\n\s*(https?:\/\/[^\s\n]+)/i);
                const receviedTime = parsed.date;
                const url = redditLinkMatch ? redditLinkMatch[1] : '';
                
                if (url) {
                  console.log('找到链接:', url);
                  mail_list.push({url, receviedTime});
                  
                  // 将数据插入到数据库
                  insertCrawlMessage(url, receviedTime).catch(err => {
                    console.error('插入数据库失败:', err);
                  });
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

class EmailCronJob {
  constructor() {
    this.isRunning = false;
    this.task = null;
  }

  // 启动定时任务
  start() {
    if (this.task) {
      console.log('定时任务已经在运行中');
      return;
    }

    console.log('启动邮件定时抓取任务...');
    
    // 每小时的第0分钟执行
    this.task = cron.schedule('0 * * * *', async () => {
      await this.executeTask();
    }, {
      scheduled: true,
      timezone: "Asia/Shanghai"
    });

    console.log('定时任务已启动，每小时抓取一次邮件');
    
    // 启动时立即执行一次
    setTimeout(() => {
      this.executeTask();
    }, 5000); // 延迟5秒执行，确保应用完全启动
  }

  // 停止定时任务
  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
      console.log('定时任务已停止');
    }
  }

  // 执行抓取任务
  async executeTask() {
    if (this.isRunning) {
      console.log('邮件抓取任务正在运行中，跳过本次执行');
      return;
    }

    this.isRunning = true;
    const startTime = new Date();
    console.log(`开始定时抓取邮件 - ${startTime.toLocaleString()}`);

    try {
      const emailList = await scanEmails();
      const endTime = new Date();
      const duration = endTime - startTime;
      console.log(`定时任务完成，抓取到 ${emailList.length} 封邮件，耗时 ${duration}ms - ${endTime.toLocaleString()}`);
    } catch (error) {
      console.error('定时抓取邮件时出错:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // 手动执行任务
  async manualExecute() {
    console.log('手动触发邮件抓取任务...');
    await this.executeTask();
  }

  // 获取任务状态
  getStatus() {
    return {
      isScheduled: !!this.task,
      isRunning: this.isRunning,
      nextExecution: this.task ? '每小时的第0分钟' : '未启动'
    };
  }
}

module.exports = new EmailCronJob();