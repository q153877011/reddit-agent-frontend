import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate, useParams } from 'react-router-dom';
import GetAnswer from './GetAnswer';
import Card from './Card';
import './App.css';

// GetAnswer组件的路由包装器
function GetAnswerWrapper() {
  const { recordId } = useParams();
  return <GetAnswer recordId={recordId || null} />;
}

// Reddit列表页面组件
function RedditPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mailList, setMailList] = useState([]);
  const [mailLoading, setMailLoading] = useState(false);
  const [mailError, setMailError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecords();
    fetchMailList();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const serverUrl = process.env.SERVER_BASE_URL;
      const response = await fetch(`${serverUrl}/item`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      console.error('获取数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMailList = async () => {
    try {
      setMailLoading(true);
      setMailError(null);
      const serverUrl = process.env.SERVER_BASE_URL;
      const response = await fetch(`${serverUrl}/scan-gmail`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setMailList(Array.isArray(data.mailList) ? data.mailList : []);
    } catch (err) {
      setMailError(err.message);
      console.error('获取邮件数据失败:', err);
    } finally {
      setMailLoading(false);
    }
  };

  const refreshData = () => {
    fetchRecords();
    fetchMailList();
  };

  const handleGoToAnswer = (recordId) => {
    if (recordId) {
      navigate(`/answer/${recordId}`);
    } else {
      navigate('/answer');
    }
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">正在加载数据...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">
          <h2>加载失败</h2>
          <p>错误信息: {error}</p>
          <button onClick={refreshData} className="retry-btn">重试</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="app">
        <div className="loading">正在加载数据...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">
          <h2>加载失败</h2>
          <p>错误信息: {error}</p>
          <button onClick={refreshData} className="retry-btn">重试</button>
        </div>
      </div>
    );
  }

  return (
    <main className="app-main">
      {records.length === 0 ? (
        <div className="no-data">
          <h2>暂无数据</h2>
          <p>数据库中没有找到任何记录</p>
        </div>
      ) : (
        <div className="records-container">
          <div className="records-grid">
            {records.map((record, index) => (
              <Card 
                key={record.id || index}
                record={record}
                index={index}
                handleGoToAnswer={handleGoToAnswer}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* 邮件列表部分 */}
      <div className="mail-section">
        <div className="section-header">
          <h3>F5Bot 扫描结果</h3>
          <button onClick={fetchMailList} className="refresh-btn" disabled={mailLoading}>
            {mailLoading ? '扫描中...' : '刷新'}
          </button>
        </div>
        
        {mailError && (
          <div className="error-message">
            <p>邮件获取失败: {mailError}</p>
          </div>
        )}
        
        {mailLoading ? (
          <div className="loading-message">正在扫描邮件...</div>
        ) : (
          <div className="mail-list">
            {mailList.length === 0 ? (
              <div className="no-mail">暂无邮件数据</div>
            ) : (
              <div className="mail-items">
                {mailList.map((mail, index) => (
                  <div key={index} className="mail-item">
                    <div className="mail-info">
                      <div className="mail-url">
                        <a href={mail.url} target="_blank" rel="noopener noreferrer" title={mail.url}>
                          {mail.url}
                        </a>
                      </div>
                      <div className="mail-time">
                        {new Date(mail.receviedTime).toLocaleString('zh-CN')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

// 主App组件
function App() {
  return (
    <div className="app">
      <nav className="app-nav">
        <div className="nav-container">
          <div className="nav-brand">
            <h2>AI Reddit 应用</h2>
          </div>
          <div className="nav-links">
            <NavLink 
              to="/" 
              className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}
              end
            >
              Reddit 数据
            </NavLink>
            <NavLink 
              to="/answer" 
              className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}
            >
              智能问答
            </NavLink>
          </div>
        </div>
      </nav>
      
      <div className="app-content">
        <Routes>
          <Route path="/" element={<RedditPage />} />
          <Route path="/answer" element={<GetAnswerWrapper />} />
          <Route path="/answer/:recordId" element={<GetAnswerWrapper />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;