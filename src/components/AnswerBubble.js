import React from 'react';
import './AnswerBubble.css';

const AnswerBubble = ({ message, isLoading }) => {
  const renderContent = (content, citations) => {
    if (!citations || citations.length === 0) {
      return <div dangerouslySetInnerHTML={{ __html: content }} />;
    }

    let result = content;
    citations.forEach((citation) => {
      const placeholder = `[CITATION_${citation.id}]`;
      const citationElement = `<span class="citation-link-inline" data-citation-id="${citation.id}">[${citation.id}]</span>`;
      result = result.replace(new RegExp(placeholder, 'g'), citationElement);
    });

    return <div dangerouslySetInnerHTML={{ __html: result }} />;
  };

  const getMessageClass = () => {
    if (message.type === 'question') return 'question-bubble';
    if (message.type === 'error') return 'error-bubble';
    if (message.hasSufficientEvidence === false) return 'insufficient-evidence-bubble';
    return 'answer-bubble';
  };

  const getMessageIcon = () => {
    if (message.type === 'question') return '👤';
    if (message.type === 'error') return '⚠️';
    if (message.hasSufficientEvidence === false) return '🔍';
    return '🤖';
  };

  return (
    <div className={`message-wrapper ${getMessageClass()}`}>
      <div className="message-bubble">
        <div className="message-header">
          <span className="message-icon">{getMessageIcon()}</span>
          <span className="message-type">
            {message.type === 'question' ? 'You' : 
             message.type === 'error' ? 'Error' :
             message.hasSufficientEvidence === false ? 'Insufficient Evidence' : 'AI Assistant'}
          </span>
          <span className="message-time">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
        
        <div className="message-content">
          {isLoading ? (
            <div className="loading-indicator">
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="loading-text">Analyzing medical literature...</span>
            </div>
          ) : (
            <>
              {renderContent(message.content, message.citations)}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnswerBubble;