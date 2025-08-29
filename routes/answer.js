var express = require('express');
var router = express.Router();

// 添加CORS中间件允许跨域请求
router.use((req, res, next) => {
  // 允许特定来源的跨域请求（支持credentials）
  res.header('Access-Control-Allow-Origin', 'http://localhost:3001');
  // 允许发送凭据
  res.header('Access-Control-Allow-Credentials', 'true');
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

/* POST route */
router.post('/', async function(req, res, next) {
  try {
    // 获取用户提交的问题
    const { question } = req.body;
    console.log(question)
    console.log(process.env.API_URL)
    
    if (!question) {
      return res.status(400).json({ error: '请提供问题内容' });
    }

    // 调用AI API
    const agentResponse = await fetch(process.env.API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AGENT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: {},
        query: question,
        user: 'wenyi',
        response_mode: "streaming",
      })
    });

    if (!agentResponse.ok) {
      throw new Error(`API请求失败: ${agentResponse.status} ${agentResponse.statusText}`);
    }

    // 设置流式响应头
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    
    const reader = agentResponse.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    
    while(true) {
      const { done, value } = await reader.read();
      
      if(done) {
        console.log('流式响应结束');
        break;
      }
      
      const chunk = decoder.decode(value, {stream: true});
      fullResponse += chunk;
      
      // 将数据块发送给客户端
      res.write(chunk);
    }
    
    // 结束响应
    res.end();
    
  } catch (error) {
    console.error('处理请求时出错:', error);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: '服务器内部错误', 
        details: error.message 
      });
    }
  }
});

router.get('/', async function(req, res, next) {
  try {
    // 设置SSE响应头
    res.writeHead(200, {
       'Content-Type': 'text/event-stream',
       'Cache-Control': 'no-cache',
       'Connection': 'keep-alive',
       'Access-Control-Allow-Origin': 'http://localhost:3001',
       'Access-Control-Allow-Credentials': 'true',
       'Access-Control-Allow-Headers': 'Cache-Control'
     });
     
    // 设置超时处理（2分钟）
    const timeout = setTimeout(() => {
      console.log('SSE连接超时，关闭连接');
      if (!res.headersSent || !res.destroyed) {
        res.write(`data: ${JSON.stringify({ error: '请求超时' })}

`);
        res.end();
      }
    }, 1200000); // 设置为20分钟超时
    
    // 客户端断开连接时清理
    req.on('close', () => {
      console.log('客户端断开SSE连接');
      clearTimeout(timeout);
    });
    
    req.on('error', (err) => {
      console.error('SSE连接错误:', err);
      clearTimeout(timeout);
    });

    // 获取问题参数
    const question = req.query.question || '默认问题';
    console.log('SSE请求问题:', question);
    console.log('API_URL:', process.env.API_URL);
    
    if (!question || question === '默认问题') {
      res.write(`data: ${JSON.stringify({ error: '请提供问题内容' })}\n\n`);
      res.end();
      return;
    }

    // 调用AI API
    const agentResponse = await fetch(process.env.API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AGENT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: {},
        query: question,
        user: 'wenyi',
        response_mode: "streaming",
      })
    });

    if (!agentResponse.ok) {
      throw new Error(`API请求失败: ${agentResponse.status} ${agentResponse.statusText}`);
    }

    const reader = agentResponse.body.getReader();
    const decoder = new TextDecoder();
    
    while(true) {
      const { done, value } = await reader.read();
      
      if(done) {
        console.log('SSE流式响应结束');
        clearTimeout(timeout);
        res.write('event: end\ndata: {"status": "completed"}\n\n');
        break;
      }
      
      // 检查连接是否还活跃
      if (res.destroyed) {
        console.log('客户端连接已断开，停止发送数据');
        clearTimeout(timeout);
        break;
      }
      
      const chunk = decoder.decode(value, {stream: true});
      
      // 将数据以SSE格式发送
      res.write(`data: ${chunk}\n\n`);
    }
    
    // 结束SSE连接
    if (!res.destroyed) {
      res.end();
    }
    
  } catch (error) {
    console.error('SSE处理请求时出错:', error);
    
    // 清理超时定时器
    if (typeof timeout !== 'undefined') {
      clearTimeout(timeout);
    }
    
    if (!res.headersSent) {
      res.writeHead(500, {
         'Content-Type': 'text/event-stream',
         'Access-Control-Allow-Origin': 'http://localhost:3001',
         'Access-Control-Allow-Credentials': 'true'
       });
    }
    
    if (!res.destroyed) {
      res.write(`data: ${JSON.stringify({ error: '服务器内部错误', details: error.message })}\n\n`);
      res.end();
    }
  }
});

module.exports = router;