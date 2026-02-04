import { useEffect, useState, useMemo } from 'react';
import './QuestionInput.css';
import GlobalPatientSelector from '../components/GlobalPatientSelector/GlobalPatientSelector';

const QuestionInput = ({ onQuestionSubmit, currentQuestion, setCurrentQuestion, isChatMode, onExcludeContextChange, excludeContext, openConfirmationModal, isPatientContextActiveInSession, isConfirmationModalOpen, patientToConfirmId, isConfirmingNewPatient, closeConfirmationModal, activatePatientContextInSession, deactivatePatientContextInSession, handleToggleSidebar }) => {
  const question = currentQuestion;
  const setQuestion = setCurrentQuestion;

  // The fixed prefix text
  const prefix = "Ask Dohrnii ";

  // Questions to animate
  const suggestions = useMemo(() => [
    "what is causing my headache?",
    "how to reduce stress?",
    "why am I feeling tired?",
    "what foods improve immunity?",
    "should I see a doctor?"
  ], []);

  const [animatedText, setAnimatedText] = useState("");
  const [index, setIndex] = useState(0);
  const [typing, setTyping] = useState(true);
  const [char, setChar] = useState(0);

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
    if (question.trim()) {
      onQuestionSubmit(question);
      setQuestion('');
    }
  };

  return (
    <div className="question-input-container">
      <form className="question-input-form" onSubmit={handleSubmit}>
        <div className="question-input-field-container">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={isChatMode ? "Ask Dohrnii anything" : prefix + animatedText}
            className={`question-input-field ${isChatMode ? '' : 'animated-placeholder'}`}
          />
        </div>
        <div className="question-input-button-container">
          <GlobalPatientSelector
          isConfirmationModalOpen={isConfirmationModalOpen}
          patientToConfirmId={patientToConfirmId}
          isConfirmingNewPatient={isConfirmingNewPatient}
          openConfirmationModal={openConfirmationModal}
          closeConfirmationModal={closeConfirmationModal}
          isPatientContextActiveInSession={isPatientContextActiveInSession}
          activatePatientContextInSession={activatePatientContextInSession}
          deactivatePatientContextInSession={deactivatePatientContextInSession}
          />
          <button type="submit" className="question-input-button">Ask Dohrnii</button>
        </div>
      </form>
    </div>
  );
};

export default QuestionInput;
