import React, { useEffect, useState } from 'react';
import './styles/GetAnswer.css';
import MDEditor from '@uiw/react-md-editor';

function GetAnswer({ recordId = null }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [extractedTitles, setExtractedTitles] = useState([]);
  const [recordLoading, setRecordLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [showTitlesFlow, setShowTitlesFlow] = useState(true);

  // 当recordId改变时获取记录数据
  useEffect(() => {
    const fetchRecord = async () => {
      if (!recordId) {
        setQuestion('');
        setAnswer('');
        return;
      }

      setRecordLoading(true);
      try {
        const serverUrl = process.env.REACT_APP_SERVER_BASE_URL || 'http://localhost:3000';
        const response = await fetch(`${serverUrl}/item`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const records = await response.json();
        const record = records.find(r => r.id === recordId || r.id === parseInt(recordId));
        
        if (record) {
          setQuestion(record.question || record.title || '');
          setAnswer(record.answer || '');
        } else {
          setError(`未找到ID为${recordId}的记录`);
        }
      } catch (err) {
        setError(`获取记录失败: ${err.message}`);
        console.error('获取记录失败:', err);
      } finally {
        setRecordLoading(false);
      }
    };

    fetchRecord();
  }, [recordId]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) {
      setError('请输入问题');
      return;
    }

    setLoading(true);
    setError('');
    setAnswer('');
    setExtractedTitles([]);

    const serverUrl = process.env.REACT_APP_SERVER_BASE_URL || 'http://localhost:3000';
    const eventSource = new EventSource(`${serverUrl}/answer?question=${encodeURIComponent(question)}`, {
      withCredentials: true,
    });
    
    // 设置超时处理
    const timeoutId = setTimeout(() => {
      if (eventSource.readyState !== EventSource.CLOSED) {
        console.log('请求超时，关闭连接');
        eventSource.close();
        setLoading(false);
        setError('请求超时，请重试');
      }
    }, 1200000); // 设置为20分钟超时
    
    // 监听默认消息
    eventSource.onmessage = (event) => {
      // console.log('接收到数据:', event.data);
      
      try {
        // 尝试解析JSON数据
        const data = JSON.parse(event.data);
        
        // 处理错误信息
        if (data.error) {
          setError(data.error);
          setLoading(false);
          eventSource.close();
          return;
        }
        
        // 处理完成状态
        if (data.status === 'completed') {
          clearTimeout(timeoutId);
          setLoading(false);
          eventSource.close();
          return;
        }
        
        console.log(data)
        // 提取title字段
        if (data.data.title) {
          const title = data.data.title
          console.log(title)
          setExtractedTitles(prev => {
            const newTitle = { id: prev.length + 1, title: title, order: prev.length + 1 };
            return [...prev, newTitle];
          });
        }
        
        // 处理答案数据
        if (data.data && data.data.outputs) {
          let outputs = data.data.outputs;
          
          // 递归提取文本内容
          while (outputs && typeof outputs === 'object') {
            if (outputs.answer) {
              outputs = outputs.answer;
            } else if (outputs.text) {
              outputs = outputs.text;
            } else {
              break;
            }
          }
          
          if (typeof outputs === 'string' && !outputs.startsWith('{')) {
            setAnswer(prevAnswer => prevAnswer + outputs);
          }
        }
        
      } catch (parseError) {
        // 如果不是JSON格式，直接处理为文本
        let chunk = event.data;
        
        // 解码Unicode转义序列
        chunk = chunk.replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => {
          return String.fromCharCode(parseInt(code, 16));
        });
        
        // 检查是否包含data:前缀
        if (chunk.startsWith('data: ')) {
          chunk = chunk.replace('data: ', '');
          
          try {
            const parsedChunk = JSON.parse(chunk);
            // 提取title
            if (parsedChunk.title) {
              // console.log(parsedChunk.title)
              setExtractedTitles(prev => {
                const newTitle = { id: prev.length + 1, title: parsedChunk.title, order: prev.length + 1 };
                return [...prev, newTitle];
              });
            }
            
            // 处理答案内容
            if (parsedChunk.data && parsedChunk.data.outputs) {
              let outputs = parsedChunk.data.outputs;
              
              while (outputs && typeof outputs === 'object') {
                if (outputs.answer) {
                  outputs = outputs.answer;
                } else if (outputs.text) {
                  outputs = outputs.text;
                } else {
                  break;
                }
              }
              
              if (typeof outputs === 'string' && !outputs.startsWith('{')) {
                setAnswer(prevAnswer => prevAnswer + outputs);
              }
            }
            
          } catch (innerError) {
            console.log('内部解析错误:', innerError);
            
            // 如果解析错误，尝试用正则匹配title
            const titleRegex = /"title"\s*:\s*"([^"]+)"/;
            const titleMatch = chunk.match(titleRegex);
            
            if (titleMatch && titleMatch[1]) {
              const extractedTitle = titleMatch[1];
              setExtractedTitles(prev => {
                const newTitle = { id: prev.length + 1, title: extractedTitle, order: prev.length + 1 };
                return [...prev, newTitle];
              });
            }
          }
        }
      }
    };

    // 监听结束事件
    eventSource.addEventListener('end', (event) => {
      console.log('流式传输结束:', event.data);
      clearTimeout(timeoutId);
      setLoading(false);
      eventSource.close();
    });

    // 监听错误事件
    eventSource.addEventListener('error', (event) => {
      console.error('EventSource错误:', event);
      clearTimeout(timeoutId);
      setError('连接错误，请重试');
      setLoading(false);
      eventSource.close();
    });
    
    // 保存EventSource引用以便清理
    const cleanup = () => {
      clearTimeout(timeoutId);
      if (eventSource.readyState !== EventSource.CLOSED) {
        eventSource.close();
      }
    };
    
    // 在组件卸载时清理
    return cleanup;
  };

  const handleClear = () => {
    setQuestion('');
    setAnswer('');
    setError('');
    setExtractedTitles([]);
  };

  const handleSave = async () => {
    if (!question.trim() || !answer.trim()) {
      setError('无法保存：缺少问题或答案内容');
      return;
    }

    setSaveLoading(true);
    try {
      let response;
      
      if (recordId) {
        // 有ID时更新现有记录
        const serverUrl = process.env.REACT_APP_SERVER_BASE_URL || 'http://localhost:3000';
        response = await fetch(`${serverUrl}/item/${recordId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            answer: answer
          })
        });
      } else {
        // 没有ID时新建记录
        const serverUrl = process.env.REACT_APP_SERVER_BASE_URL || 'http://localhost:3000';
        response = await fetch(`${serverUrl}/item`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: question,
            answer: answer,
            title: question.substring(0, 50) + (question.length > 50 ? '...' : ''),
            url: '',
            score: 0,
            num_comments: 0,
            created_utc: Math.floor(Date.now() / 1000)
          })
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('保存成功:', result);
      setError('');
      
      // 如果是新建记录，可以考虑设置recordId以便后续更新
      // if (!recordId && result.id) {
      //   setRecordId(result.id);
      // }
    } catch (err) {
      setError(`保存失败: ${err.message}`);
      console.error('保存失败:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="get-answer-container">
      {recordLoading && (
        <div className="loading-message">正在加载记录数据...</div>
      )}

      <div className="question-section">
        <form onSubmit={handleSubmit} className="question-form">
          <div className="input-group">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="请输入您的问题..."
              className="question-input"
              rows={4}
              disabled={loading}
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="button-group">
            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading || !question.trim()}
            >
              {loading ? '生成中...' : '获取答案'}
            </button>
            <button 
              type="button" 
              onClick={handleClear}
              className="clear-btn"
              disabled={loading}
            >
              清空
            </button>
          </div>
        </form>
      </div>

      <div className="answer-section">
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>正在生成答案，请稍候...</p>
          </div>
        )}
        
        {/* Title流程独立显示 */}
        {extractedTitles.length > 0 && showTitlesFlow && (
          <div className="titles-section">
            <div className="titles-header">
              <h3>Agent 流程</h3>
              <button 
                className="close-titles-btn" 
                onClick={() => setShowTitlesFlow(false)}
                title="关闭流程显示"
              >
                ×
              </button>
            </div>
            <div className="titles-flow">
              {/* 初始化流程 */}
              <div className="title-flow-item">
                <div className="title-step">
                  <div className="step-number">0</div>
                  <div className="step-title">初始化</div>
                </div>
                <div className="flow-arrow">↓</div>
              </div>
              {extractedTitles.map((item, index) => (
                <div key={item.id} className="title-flow-item">
                  <div className="title-step">
                    <div className="step-number">{item.order}</div>
                    <div className="step-title">{item.title}</div>
                  </div>
                  {index < extractedTitles.length - 1 && (
                    <div className="flow-arrow">↓</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 答案内容 */}
        {answer && (
          <div className="answer-container">
            <div className="answer-header">
              <h3>答案</h3>
              <button 
                onClick={handleSave}
                className="save-btn"
                disabled={saveLoading || !answer.trim() || !question.trim()}
              >
                {saveLoading ? '保存中...' : (recordId ? '保存' : '新建')}
              </button>
            </div>
            <div className="answer-content">
              <MDEditor
                value={answer}
                onChange={setAnswer}
                preview="live"  // 实时预览
                height={400}
              />
            </div>
          </div>
        )}
        
        {!answer && !loading && (
          <div className="empty-state">
            <p>在上方输入问题，点击"获取答案"按钮开始</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default GetAnswer;