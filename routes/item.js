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
    connection.query('INSERT INTO reddit_record SET ?', data, (err, result) => {
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


module.exports = router;
