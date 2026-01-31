import React, { useState, useEffect } from 'react';
import './Chat.css';
import QuestionInput from './QuestionInput';
import AnswerBubble from './AnswerBubble';
import { generateAnswer } from '../services/api';
import { usePatientContext } from '../context/PatientContext';

const Chat = ({ user }) => {
  const { selectedPatient } = usePatientContext();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [questionHistory, setQuestionHistory] = useState([]);

  useEffect(() => {
    const storedHistory = localStorage.getItem(`medicalHistory_${user?.id}`);
    if (storedHistory) {
      setQuestionHistory(JSON.parse(storedHistory));
    }
  }, [user]);

  const saveToHistory = (newHistory) => {
    setQuestionHistory(newHistory);
    localStorage.setItem(`medicalHistory_${user?.id}`, JSON.stringify(newHistory));
  };

  const handleQuestionSubmit = async (question) => {
    const userMessage = {
      id: Date.now(),
      type: 'question',
      content: question,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await generateAnswer(question, selectedPatient);
      
      const answerMessage = {
        id: Date.now() + 1,
        type: 'answer',
        content: response.answer,
        citations: response.citations,
        hasSufficientEvidence: response.hasSufficientEvidence,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, answerMessage]);

      // Save to history
      const historyItem = {
        id: Date.now(),
        question: question,
        answer: response.answer,
        citations: response.citations,
        hasSufficientEvidence: response.hasSufficientEvidence,
        timestamp: new Date().toISOString()
      };

      saveToHistory([...questionHistory, historyItem]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: 'Sorry, I encountered an error while processing your question. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromHistory = (historyItem) => {
    const questionMessage = {
      id: Date.now(),
      type: 'question',
      content: historyItem.question,
      timestamp: historyItem.timestamp
    };

    const answerMessage = {
      id: Date.now() + 1,
      type: 'answer',
      content: historyItem.answer,
      citations: historyItem.citations,
      hasSufficientEvidence: historyItem.hasSufficientEvidence,
      timestamp: historyItem.timestamp
    };

    setMessages([questionMessage, answerMessage]);
  };

  return (
    <div className="chat">
      <div className="chat-container">
        <div className="chat-sidebar">
          <div className="sidebar-header">
            <h3>Question History</h3>
          </div>
          <div className="history-list">
            {questionHistory.length === 0 ? (
              <p className="no-history">No previous questions</p>
            ) : (
              questionHistory.slice().reverse().map((item) => (
                <div
                  key={item.id}
                  className="history-item"
                  onClick={() => loadFromHistory(item)}
                >
                  <div className="history-question">
                    {item.question.substring(0, 60)}...
                  </div>
                  <div className="history-date">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="chat-main">
          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="empty-state">
                <h3>Welcome to Medical AI Assistant</h3>
                <p>Ask your medical question below to get evidence-based answers with citations.</p>
              </div>
            ) : (
              messages.map((message) => (
                <AnswerBubble
                  key={message.id}
                  message={message}
                  isLoading={isLoading && message.id === messages[messages.length - 1]?.id}
                />
              ))
            )}
          </div>

          <QuestionInput
            onSubmit={handleQuestionSubmit}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default Chat;