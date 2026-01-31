import React from 'react';
import './PrimaryActionButton.css';

interface PrimaryActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

const PrimaryActionButton: React.FC<PrimaryActionButtonProps> = ({ label, ...props }) => {
  return (
    <button className="primary-action-button" {...props}>
      {label}
    </button>
  );
};

export default PrimaryActionButton;