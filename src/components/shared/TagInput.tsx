import React, { useState, useId } from 'react';
import './TagInput.css';

interface TagInputProps {
  label: string;
  placeholder: string;
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  id?: string;
  className?: string;
}

const TagInput: React.FC<TagInputProps> = ({ label, placeholder, tags, onAddTag, onRemoveTag, id, className }) => {
  const [inputValue, setInputValue] = useState('');
  const generatedId = useId();
  const inputId = id || generatedId;


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleAddTag = () => {
    if (inputValue.trim() && !tags.includes(inputValue.trim())) {
      onAddTag(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="tag-input-container">
      <label htmlFor={inputId} className="tag-input-label">{label}</label>
      <div className="tag-input-field">
        {tags.map((tag) => (
          <span key={tag} className="tag">
            {tag}
            <button type="button" onClick={() => onRemoveTag(tag)} className="tag-remove-button">
              &times;
            </button>
          </span>
        ))}
        <input
          id={inputId}
          name={inputId}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="tag-input"
        />
        <button type="button" onClick={handleAddTag} className="tag-add-button">
          Add
        </button>
      </div>
    </div>
  );
};

export default TagInput;