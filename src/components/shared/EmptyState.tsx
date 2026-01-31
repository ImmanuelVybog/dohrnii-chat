import React from 'react';
import './EmptyState.css';

interface EmptyStateProps {
  message: string;
  icon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message, icon }) => {
  return (
    <div className="empty-state-container">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <p className="empty-state-message">{message}</p>
    </div>
  );
};

export default EmptyState;