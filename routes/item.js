var express = require('express');
var router = express.Router();

const mysql = require('mysql')
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})
connection.connect()

/* GET home page. */
router.get('/', function(req, res, next) {
  let result
  connection.query('SELECT * FROM reddit_record', (err, rows, fields) => {
    if (err) {
      res.send(err)
      throw err
    }

    console.log('The solution is: ', rows)
    result = rows
    res.send(result)
  })
});

/* POST route */
router.post('/', function(req, res, next) {
  // 调试信息：检查请求头和请求体
  console.log('Request headers:', req.headers);
  console.log('Content-Type:', req.get('Content-Type'));
  console.log('Raw body:', req.body);
  
  const data = req.body;
  console.log('Received data:', data)
  
  // 将接收到的数据插入到数据库中
  if (data && Object.keys(data).length > 0) {
    // 定义数据库表的字段及其默认值
    const fieldDefaults = {
      'question': '',
      'role': 0,
      'proxy': '',
      'answer': '',
    };
    
    // 确保所有字段都存在，缺失的字段设置为对应的默认值
    const processedData = {};
    Object.keys(fieldDefaults).forEach(field => {
      if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
        processedData[field] = data[field];
      } else {
        processedData[field] = fieldDefaults[field];
      }
    });
    
    console.log('Processed data with default values:', processedData);
    
    connection.query('INSERT INTO reddit_record SET ?', processedData, (err, result) => {
      if (err) {
        console.error('数据库插入错误:', err);
        return res.status(500).json({ error: '数据库插入失败', details: err.message });
      }
      console.log('数据插入成功，插入ID:', result.insertId);
    });
  } else {
    console.log('没有接收到有效数据，跳过数据库插入');
  }
  
  res.json({ 
    message: 'Data received successfully', 
    receivedData: data,
    contentType: req.get('Content-Type')
  })
});

/* PUT route for updating records */
router.put('/:id', function(req, res, next) {
  // 调试信息：检查请求头和请求体
  console.log('Request headers:', req.headers);
  console.log('Content-Type:', req.get('Content-Type'));
  console.log('Raw body:', req.body);
  
  const id = req.params.id;
  const data = req.body;
  console.log('Received data for update:', data, 'ID:', id)
  
  // 将接收到的数据更新到数据库中
  if (data && Object.keys(data).length > 0) {
    // 定义数据库表的字段及其默认值
    const fieldDefaults = {
      'question': '',
      'role': 0,
      'proxy': '',
      'answer': '',
    };
    
    // 确保所有字段都存在，缺失的字段设置为对应的默认值
    const processedData = {};
    Object.keys(fieldDefaults).forEach(field => {
      if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
        processedData[field] = data[field];
      } else {
        processedData[field] = fieldDefaults[field];
      }
    });
    
    console.log('Processed data with default values:', processedData);
    
    connection.query('UPDATE reddit_record SET ? WHERE id = ?', [processedData, id], (err, result) => {
      if (err) {
        console.error('数据库更新错误:', err);
        return res.status(500).json({ error: '数据库更新失败', details: err.message });
      }
      console.log('数据更新成功，影响行数:', result.affectedRows);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: '未找到指定ID的记录' });
      }
      
      res.json({ 
        message: 'Data updated successfully', 
        updatedData: processedData,
        affectedRows: result.affectedRows
      });
    });
  } else {
    console.log('没有接收到有效数据，跳过数据库更新');
    res.status(400).json({ error: '没有提供有效的更新数据' });
  }
});


module.exports = router;
