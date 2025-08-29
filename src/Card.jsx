import React from 'react';

function Card({ record, index, handleGoToAnswer }) {
  return (
    <div className="record-card">
      <div className="record-header">
        <span className="record-id">#{record.id || index + 1}</span>
        <div className="answer-status">
          {record.answer && record.answer.trim() !== '' ? (
            <span 
              className="status-answered clickable" 
              onClick={() => handleGoToAnswer(record.id || index + 1)}
              title="点击查看答案详情"
            >
              ✓ 已回答
            </span>
          ) : (
            <span 
              className="status-unanswered clickable" 
              onClick={() => handleGoToAnswer(record.id || index + 1)}
              title="点击跳转到智能问答页面"
            >
              ○ 未回答
            </span>
          )}
        </div>
      </div>
      <div className="record-content">
        {Object.entries(record)
          .filter(([key]) => key !== 'id')
          .map(([key, value]) => (
            <div key={key} className="record-field">
              <span className="field-label">{key}:</span>
              <span className="field-value">
                {value !== null && value !== undefined ? String(value) : '空'}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

export default Card;