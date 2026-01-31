import React, { useState, useRef, useEffect } from 'react';
import './CustomSelect.css';

const CustomSelect = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  const selectedOption = options.find(option => option.value === value);
  const displayValue = selectedOption ? selectedOption.label : placeholder || 'Select an option';

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleClickOutside = (event) => {
    if (selectRef.current && !selectRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`custom-select-container ${isOpen ? 'open' : ''}`} ref={selectRef}>
      <div className="custom-select-header" onClick={handleToggle}>
        <span className="custom-select-value">{displayValue}</span>
        <span className="custom-select-arrow"></span>
      </div>
      <div className="custom-select-options">
        {options.map((option) => (
          <div
            key={option.value}
            className={`custom-select-option ${option.value === value ? 'selected' : ''}`}
            onClick={() => handleOptionClick(option.value)}
          >
            {option.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomSelect;
