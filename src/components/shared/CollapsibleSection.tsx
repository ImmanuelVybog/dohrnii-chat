import React, { useState } from 'react';
import './CollapsibleSection.css';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  initiallyOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, initiallyOpen = false }) => {
  const [isCollapsed, setIsCollapsed] = useState(!initiallyOpen);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="collapsible-section">
      <div className="collapsible-header" onClick={toggleCollapse}>
        <h2>{title}</h2>
        <span className="collapse-icon">
          {isCollapsed ? <ChevronDown /> : <ChevronUp />}
        </span>
      </div>
      {!isCollapsed && <div className="collapsible-content">{children}</div>}
    </div>
  );
};

export default CollapsibleSection;