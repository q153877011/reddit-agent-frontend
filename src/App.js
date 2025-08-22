import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch('/item');
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

  const refreshData = () => {
    fetchRecords();
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

  return (
    <div className="app">
      <header className="app-header">
        <h1>Reddit Records Dashboard</h1>
        <button onClick={refreshData} className="refresh-btn">刷新数据</button>
      </header>
      
      <main className="app-main">
        {records.length === 0 ? (
          <div className="no-data">
            <h2>暂无数据</h2>
            <p>数据库中没有找到任何记录</p>
          </div>
        ) : (
          <div className="records-container">
            <div className="records-summary">
              <h2>数据概览</h2>
              <p>共找到 <strong>{records.length}</strong> 条记录</p>
            </div>
            
            <div className="records-grid">
              {records.map((record, index) => (
                <div key={record.id || index} className="record-card">
                  <div className="record-header">
                    <span className="record-id">#{record.id || index + 1}</span>
                  </div>
                  <div className="record-content">
                    {Object.entries(record).map(([key, value]) => (
                      <div key={key} className="record-field">
                        <span className="field-label">{key}:</span>
                        <span className="field-value">
                          {value !== null && value !== undefined ? String(value) : '空'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;