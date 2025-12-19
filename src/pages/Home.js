import { useState, useEffect } from 'react';
import './Home.css';
import Header from '../components/Header';
import QuestionInput from '../components/QuestionInput';
import Sidebar from '../components/Sidebar';
import Login from '../components/Login';
import AccountPopup from '../components/AccountPopup';
import dohrniiLogoIcon from '../assets/images/Dohrnii Logo Icon.svg'
import dohrniiHeroIcon from '../assets/images/Dohrnii Home Chat Icon.svg';
import { ThemeProvider } from '../context/ThemeContext';



const Home = () => {
  const [chatMessages, setChatMessages] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [user, setUser] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState('');

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [typingMessageIndex, setTypingMessageIndex] = useState(null);
  const [displayedAiResponse, setDisplayedAiResponse] = useState('');
  const [isAccountPopupOpen, setIsAccountPopupOpen] = useState(false);



  const handleMenuClick = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

    const handleSuggestionClick = (suggestion) => {
    setCurrentQuestion(suggestion);
    handleQuestionSubmit(suggestion);
    setConversationStarted(true);
    };

  const handleQuestionSubmit = (newQuestion) => {
    setChatMessages((prevMessages) => [...prevMessages, { type: 'user', content: newQuestion }]);
    setCurrentQuestion('');
    setConversationStarted(true);

    // Simulate AI response with references
    const aiResponseContent = `This is a simulated AI answer for: "${newQuestion}".\n\nReferences:\n1. Reference A: https://example.com/referenceA\n2. Reference B: https://example.com/referenceB`;
    const aiReferences = [
      { text: 'Reference A', url: 'https://example.com/referenceA' },
      { text: 'Reference B', url: 'https://example.com/referenceB' },
    ];

    // Add a placeholder for the AI response and start typing animation
    setChatMessages((prevMessages) => {
      const newMessages = [...prevMessages, { type: 'ai', content: '', references: aiReferences, animating: true }];
      setTypingMessageIndex(newMessages.length - 1);
      return newMessages;
    });

    // This timeout is just to simulate network delay before starting the typing animation
    // In a real app, you'd start the typing animation after receiving the actual AI response
    setTimeout(() => {
      setDisplayedAiResponse(aiResponseContent);
    }, 500); // Simulate a small delay before AI starts typing
  };

  const handleNewChat = () => {
    if (chatMessages.length > 0) {
      setConversationHistory((prevHistory) => [
        ...prevHistory,
        { id: Date.now(), messages: chatMessages, title: chatMessages[0]?.content || 'New Chat' },
      ]);
    }
    setChatMessages([]);
    setCurrentQuestion('');
    setConversationStarted(false);
  };

  const handleQuestionSelect = (selectedConversationId) => {
    const conversation = conversationHistory.find(conv => conv.id === selectedConversationId);
    if (conversation) {
      setChatMessages(conversation.messages);
      setConversationStarted(true);
      setCurrentQuestion(''); // Clear current input when loading a past chat
    }
  };

  useEffect(() => {
    if (typingMessageIndex !== null && displayedAiResponse.length > 0) {
      let i = 0;
      const typingInterval = setInterval(() => {
        setChatMessages((prevMessages) => {
          const newMessages = [...prevMessages];
          if (newMessages[typingMessageIndex]) {
            newMessages[typingMessageIndex].content = displayedAiResponse.substring(0, i);
          }
          return newMessages;
        });
        i++;
        if (i > displayedAiResponse.length) {
          clearInterval(typingInterval);
          setChatMessages((prevMessages) => {
            const newMessages = [...prevMessages];
            if (newMessages[typingMessageIndex]) {
              newMessages[typingMessageIndex].animating = false;
            }
            return newMessages;
          });
          setTypingMessageIndex(null);
          setDisplayedAiResponse('');
        }
      }, 20); // Typing speed (milliseconds per character)

      return () => clearInterval(typingInterval);
    }
  }, [displayedAiResponse, typingMessageIndex]);

  useEffect(() => {
    const storedUser = localStorage.getItem('medicalAiUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('medicalAiUser', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('medicalAiUser');
  };



  const handleOpenAccountPopup = () => {
    setIsAccountPopupOpen(true);
  };

  const handleCloseAccountPopup = () => {
    setIsAccountPopupOpen(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <ThemeProvider>
      <div className="home-layout">
      {/* <Header logoSrc={dohrniiLogoIcon} /> */}
      <div className={`main-content-area ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <Sidebar
        questions={conversationHistory}
        onQuestionSelect={handleQuestionSelect}
        isOpen={isSidebarOpen} onToggleSidebar={handleMenuClick}
        onOpenAccountPopup={handleOpenAccountPopup}
        onGoHome={() => setConversationStarted(false)}
        user={user}
        onLogout={handleLogout}
        onNewChat={handleNewChat}
        />

        <div className="chat-area">
          {!conversationStarted && (
            <div className="question-input-container">
              <div className="hero-section">
                  <img src={dohrniiHeroIcon} alt="Jellyfish Icon" className="hero-icon" />
                  <h2 className="hero-title">Ask your medical questions</h2>
                  <p className="hero-subtitle">Get evidence-based information about symptoms, conditions, and treatments.</p>
              </div>
              <QuestionInput onQuestionSubmit={handleQuestionSubmit} currentQuestion={currentQuestion} setCurrentQuestion={setCurrentQuestion} isChatMode={false} />   
              <div className="suggestion-buttons">
                  <button onClick={() => handleSuggestionClick('Symptoms of diabetes?')} className="suggestion-button">Symptoms of diabetes?</button>
                  <button onClick={() => handleSuggestionClick('How does high BP affect the body?')} className="suggestion-button">How does high BP affect the body?</button>
                  <button onClick={() => handleSuggestionClick('What should I know about antibiotics?')} className="suggestion-button">What should I know about antibiotics?</button>
              </div>
            </div>
          )}

          {conversationStarted && (
            <div className="chat-conversation-container">
              <div className="answer-display">
                {chatMessages.map((message, index) => (
                  <div key={index} className={message.type === 'user' ? 'user-message' : 'ai-message'}>
                    <p>{message.content}{message.animating && <span className="typing-cursor">|</span>}</p>
                    {message.references && !message.animating && (
                      <div className="ai-references">
                        <h4>References:</h4>
                        <ul>
                          {message.references.map((ref, refIndex) => (
                            <li key={refIndex}><a href={ref.url} target="_blank" rel="noopener noreferrer">{ref.text}</a></li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="question-input-container fixed-bottom">
                <QuestionInput onQuestionSubmit={handleQuestionSubmit} currentQuestion={currentQuestion} setCurrentQuestion={setCurrentQuestion} isChatMode={true} />
              </div>
            </div>
          )}
        </div>
      </div>

      <AccountPopup isOpen={isAccountPopupOpen} onClose={handleCloseAccountPopup} user={user} onLogout={handleLogout} />
    </div>
    </ThemeProvider>
  );
};

export default Home;