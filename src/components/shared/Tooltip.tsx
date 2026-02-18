import React, { useState, ReactNode, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './Tooltip.css';

type TooltipPosition = 'top' | 'right' | 'bottom' | 'left';

interface TooltipProps {
  children: ReactNode;
  text: string;
  position?: TooltipPosition;
}

const Tooltip: React.FC<TooltipProps> = ({ children, text, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible || !triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const gap = {
      top: 8,
      right: 24,
      bottom: 8,
      left: 8,
    };

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = rect.top - gap.top;
        left = rect.left + rect.width / 2;
        break;
      case 'right':
        top = rect.top + rect.height / 2;
        left = rect.right + gap.right;
        break;
      case 'bottom':
        top = rect.bottom + gap.bottom;
        left = rect.left + rect.width / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - gap.left;
        break;
    }

    setCoords({ top, left });
  }, [isVisible, position]);

  return (
    <>
      <div
        ref={triggerRef}
        className="tooltip-container"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>

      {isVisible &&
        createPortal(
          <div
            className={`tooltip-portal tooltip-${position} visible`}
            style={{
              top: coords.top,
              left: coords.left,
            }}
          >
            {text}
          </div>,
          document.body
        )}
    </>
  );
};

export default Tooltip;
