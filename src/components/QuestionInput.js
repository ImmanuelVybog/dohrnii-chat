import { useEffect, useState } from 'react';
import './QuestionInput.css';

const QuestionInput = ({ onQuestionSubmit, currentQuestion, setCurrentQuestion, isChatMode }) => {
  const question = currentQuestion;
  const setQuestion = setCurrentQuestion;

  // The fixed prefix text
  const prefix = "Ask Dohrnii ";

  // Questions to animate
  const suggestions = [
    "what is causing my headache?",
    "how to reduce stress?",
    "why am I feeling tired?",
    "what foods improve immunity?",
    "should I see a doctor?"
  ];

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
  }, [char, typing, index]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (question.trim()) {
      onQuestionSubmit(question);
      setQuestion('');
    }
  };

  return (
    <form className="question-input-form" onSubmit={handleSubmit}>
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder={isChatMode ? "Ask Dohrnii anything" : prefix + animatedText}
        className={`question-input-field ${isChatMode ? '' : 'animated-placeholder'}`}
      />
      <button type="submit" className="question-input-button">Ask</button>
    </form>
  );
};

export default QuestionInput;
