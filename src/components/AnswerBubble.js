import React from 'react';
import './AnswerBubble.css';

const AnswerBubble = ({ message, isLoading }) => {
  const formatContent = (content) => {
    return content.split('\n').map((paragraph, index) => (
      <p key={index} className="answer-paragraph">
        {paragraph}
      </p>
    ));
  };

  const renderCitation = (citation, index) => {
    return (
      <a
        key={index}
        href={citation.url}
        target="_blank"
        rel="noopener noreferrer"
        className="citation-link"
        title={`${citation.title} - ${citation.journal}`}
      >
        [{citation.id}]
      </a>
    );
  };

  const renderContentWithCitations = (content, citations) => {
    if (!citations || citations.length === 0) {
      return formatContent(content);
    }

    let result = content;
    citations.forEach((citation) => {
      const placeholder = `[CITATION_${citation.id}]`;
      const citationElement = `[${citation.id}]`;
      result = result.replace(new RegExp(placeholder, 'g'), citationElement);
    });

    return (
      <div className="answer-content">
        {result.split('\n').map((paragraph, index) => (
          <p key={index} className="answer-paragraph">
            {paragraph.split(/(\[\d+\])/).map((part, partIndex) => {
              const match = part.match(/\[(\d+)\]/);
              if (match) {
                const citationId = parseInt(match[1]);
                const citation = citations.find(c => c.id === citationId);
                if (citation) {
                  return renderCitation(citation, `${index}-${partIndex}`);
                }
              }
              return part;
            })}
          </p>
        ))}
      </div>
    );
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
              {message.type === 'answer' && message.hasSufficientEvidence === false ? (
                <div className="insufficient-evidence-content">
                  <div className="warning-icon">⚠️</div>
                  <div className="warning-content">
                    <h4>Insufficient Evidence</h4>
                    <p>{message.content}</p>
                    <div className="evidence-suggestion">
                      <strong>Suggestion:</strong> Try rephrasing your question or ask about a more specific medical condition or treatment.
                    </div>
                  </div>
                </div>
              ) : (
                renderContentWithCitations(message.content, message.citations)
              )}
              
              {message.type === 'answer' && message.citations && message.citations.length > 0 && message.hasSufficientEvidence !== false && (
                <div className="citations-section">
                  <h4 className="citations-title">References:</h4>
                  <div className="citations-list">
                    {message.citations.map((citation, index) => (
                      <div key={index} className="citation-item">
                        <span className="citation-number">[{citation.id}]</span>
                        <div className="citation-details">
                          <a
                            href={citation.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="citation-title"
                          >
                            {citation.title}
                          </a>
                          <div className="citation-meta">
                            {citation.journal} • {citation.year} • {citation.authors}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnswerBubble;