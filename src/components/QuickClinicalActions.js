import React, { useState, useRef, useEffect } from 'react';
import './QuickClinicalActions.css';
import downIcon from '../assets/images/down icon.svg';
import upIcon from '../assets/images/up icon.svg';

const QuickClinicalActions = ({ onActionClick }) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const popoverRef = useRef(null);

  const primaryActions = [
    { label: 'Draft DDx', message: 'Draft a differential diagnosis based on the current patient context.' },
    { label: 'Management Plan', message: 'Propose a management plan for a specific condition.' },
    { label: 'Handover Summary', message: 'Summarize key patient information for handover.' },
    { label: 'Patient Education', message: 'Draft a patient education summary.' },
  ];

  const secondaryActions = [
    { label: 'Diagnostic Workup', message: 'Suggest initial diagnostic workup based on the current patient context.' },
    { label: 'Guidelines', message: 'Find evidence-based guidelines for [condition/treatment].' },
    { label: 'Explain Concept', message: 'Explain a medical concept or term.' },
    { label: 'Drug Interaction', message: 'Provide a drug-drug interaction check for [medications].' },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsPopoverOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleActionClick = (message) => {
    onActionClick(message);
    setIsPopoverOpen(false);
  };

  return (
    <div className="quick-clinical-actions-container">
      <div className="primary-actions-row">
        {primaryActions.map((action, index) => (
          <button
            key={index}
            className="quick-clinical-action-button"
            onClick={() => handleActionClick(action.message)}
          >
            {action.label}
          </button>
        ))}
        <div className="more-actions-container" ref={popoverRef}>
          <button
            className={`quick-clinical-action-button more-button ${isPopoverOpen ? 'active' : ''}`}
            onClick={() => setIsPopoverOpen(!isPopoverOpen)}
          >
            More
            <img 
              src={isPopoverOpen ? upIcon : downIcon} 
              alt="toggle" 
              className={`more-arrow ${isPopoverOpen ? 'up' : 'down'}`}
            />
          </button>
          
          {isPopoverOpen && (
            <div className="more-actions-popover">
              {secondaryActions.map((action, index) => (
                <button
                  key={index}
                  className="popover-action-item"
                  onClick={() => handleActionClick(action.message)}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickClinicalActions;
