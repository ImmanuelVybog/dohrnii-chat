import React from 'react';
import './ResultCard.css';

interface ResultCardProps {
  title: string;
  content: React.ReactNode;
  severity?: 'low' | 'medium' | 'high';
  redFlag?: boolean;
}

const ResultCard: React.FC<ResultCardProps> = ({ title, content, severity, redFlag }) => {
  const severityClass = severity ? `result-card-${severity}` : '';
  const redFlagClass = redFlag ? 'result-card-red-flag' : '';

  return (
    <div className={`result-card ${severityClass} ${redFlagClass}`}>
      <h3 className="result-card-title">{title}</h3>
      <div className="result-card-content">{content}</div>
      {redFlag && <span className="red-flag-indicator">⚠️ Red Flag</span>}
    </div>
  );
};

export default ResultCard;