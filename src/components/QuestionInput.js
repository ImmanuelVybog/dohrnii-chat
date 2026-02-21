import { useEffect, useState, useMemo, useRef } from 'react';
import './QuestionInput.css';
import GlobalPatientSelector from './GlobalPatientSelector/GlobalPatientSelector';
import stopIcon from '../assets/images/Stop-rounded.svg';
import sendIcon from '../assets/images/send icon.svg';



const QuestionInput = ({ 
  onQuestionSubmit,
  currentQuestion,
  setCurrentQuestion,
  isChatMode,
  onExcludeContextChange,
  excludeContext,
  openConfirmationModal,
  isPatientContextActiveInSession,
  isConfirmationModalOpen,
  patientToConfirmId,
  isConfirmingNewPatient,
  closeConfirmationModal,
  activatePatientContextInSession,
  deactivatePatientContextInSession,
  handleToggleSidebar,
  isPatientSelectionModalOpen,
  onClosePatientSelectionModal,
  isLoading,
  onStop
}) => {
  const question = currentQuestion;
  const setQuestion = setCurrentQuestion;
  const textareaRef = useRef(null);

  // Questions to animate
  const suggestions = useMemo(() => [
    "Summarize this patient and highlight key red flags",
    "Generate a focused differential diagnosis",
    "Suggest initial investigations and next steps",
    "Create a concise assessment and plan",
    "Flag potential medication risks or interactions"
  ], []);

  const [animatedText, setAnimatedText] = useState("");
  const [index, setIndex] = useState(0);
  const [typing, setTyping] = useState(true);
  const [char, setChar] = useState(0);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      
      // Focus the textarea when question is updated (e.g. via quick actions)
      if (question) {
        textareaRef.current.focus();
      }
    }
  }, [question]);

  useEffect(() => {
    const current = suggestions[index];
    let timer;

    if (typing) {
      // Faster typing + fade-in effect
      timer = setTimeout(() => {
        const nextChar = current.slice(0, char + 1);
        setAnimatedText(nextChar);
        setChar(char + 1);

        if (char + 1 === current.length) {
          setTyping(false);

          // Pause before deleting
          setTimeout(() => {}, 1000);
        }
      }, 30); // typing speed
    } else {
      // Smooth deleting
      timer = setTimeout(() => {
        const nextChar = current.slice(0, char - 1);
        setAnimatedText(nextChar);
        setChar(char - 1);

        if (char - 1 === 0) {
          setTyping(true);
          setIndex((index + 1) % suggestions.length);
        }
      }, 60); // deleting speed
    }

    return () => clearTimeout(timer);
  }, [char, typing, index, suggestions]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoading) return;
    if (question.trim()) {
      onQuestionSubmit(question);
      setQuestion('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="question-input-box">
      <form className="question-input-form" onSubmit={handleSubmit}>
        <div className="question-input-field-container">
          <textarea
            ref={textareaRef}
            rows={1}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={isChatMode ? "Ask Dohrnii anything" : animatedText}
            className={`question-input-field ${isChatMode ? '' : 'animated-placeholder'}`}
          />
        </div>
        <div className="question-input-button-container">
          <GlobalPatientSelector
            isOpen={isPatientSelectionModalOpen}
            onClose={onClosePatientSelectionModal}
            isConfirmationModalOpen={isConfirmationModalOpen}
            patientToConfirmId={patientToConfirmId}
            isConfirmingNewPatient={isConfirmingNewPatient}
            openConfirmationModal={openConfirmationModal}
            closeConfirmationModal={closeConfirmationModal}
          />
          <button 
            type={isLoading ? "button" : "submit"} 
            className={`question-input-button ${isLoading ? 'stop-button' : ''}`}
            onClick={isLoading ? (e) => { e.preventDefault(); onStop(); } : undefined}
            disabled={!isLoading && !question.trim()}
          >
            {isLoading ? (
              <span className="button-content stop">
                <span className="stop-icon-symbol">
                  <img src={stopIcon} alt="Stop" />
                </span>
              </span>
            ) : (
              <span className="button-content send">
                <span className="send-icon-symbol">
                  <img src={sendIcon} alt="Send" />
                </span>
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuestionInput;