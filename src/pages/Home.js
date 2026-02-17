import { useState, useEffect, useRef } from 'react';
import './Home.css';
import QuestionInput from '../components/QuestionInput';
import AccountPopup from '../components/AccountPopup';
import QuickClinicalActions from '../components/QuickClinicalActions';
import dohrniiHeroIcon from '../assets/images/Dohrnii Home Chat Icon.svg';
import clinicalReasoningIcon from '../assets/images/clinical-reasoning-icon.svg';
import visitNotesIcon from '../assets/images/visit-notes-icon.svg';
import drugSafetyIcon from '../assets/images/drug-safety-icon.svg';
import clinicalGuidelinesIcon from '../assets/images/clinical-guidelines-icon.svg';
import calculatorsIcon from '../assets/images/calculators-icon.svg';
import differentialDiagnosisIcon from '../assets/images/differential-diagnosis-icon.svg';
import referencesIconLight from '../assets/images/references-icon-light.svg';
import referencesIconDark from '../assets/images/references-icon-dark.svg';
import { useTheme } from '../context/ThemeContext';
import { usePatientContext } from '../context/PatientContext';
import { useChatContext } from '../context/ChatContext';
import { addPatient, setActivePatient } from '../services/patientService';
import { useNavigate } from 'react-router-dom';
import PatientDetailModal from '../components/PatientDetailModal/PatientDetailModal';
import GlobalPatientSelector from '../components/GlobalPatientSelector/GlobalPatientSelector';
import { apiClient } from '../services/apiClient';

const Home = ({ openConfirmationModal, isConfirmationModalOpen, patientToConfirmId, isConfirmingNewPatient,  closeConfirmationModal, isSidebarOpen, handleToggleSidebar, handleExpandPatientSection, isAuthenticated, user, onLogout }) => {
  const navigate = useNavigate();
  const { theme, isDarkMode } = useTheme();
  const { selectedPatient, onUpdatePatient, activatePatientContextInSession, deactivatePatientContextInSession, isPatientContextActiveInSession } = usePatientContext();
  const { messages: contextMessages, addMessage, startNewChat } = useChatContext();
  
  const [currentQuestion, setCurrentQuestion] = useState('');
  // conversationStarted derived from messages length or pending message
  const [pendingAiMessage, setPendingAiMessage] = useState(null);
  const [displayedAiResponse, setDisplayedAiResponse] = useState('');
  
  const chatMessages = [...contextMessages, ...(pendingAiMessage ? [pendingAiMessage] : [])];
  const conversationStarted = chatMessages.length > 0;

  const [isAccountPopupOpen, setIsAccountPopupOpen] = useState(false);
  const [excludeContext, setExcludeContext] = useState(false);
  const [chatContext, setChatContext] = useState({ type: 'GENERAL_CHAT' });
  const [isPatientDetailModalOpen, setIsPatientDetailModalOpen] = useState(false);
  const [patientToView, setPatientToView] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const conversationContainerRef = useRef(null);
  const abortControllerRef = useRef(null);

  const isGenerating = isLoading || (pendingAiMessage && pendingAiMessage.animating);

  const handleStopResponse = () => {
    // 1. Abort API call if in progress
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // 2. Stop loading state
    setIsLoading(false);

    // 3. Finalize partial message if animating
    if (pendingAiMessage && pendingAiMessage.animating) {
      const partialMsg = { ...pendingAiMessage, animating: false };
      addMessage(partialMsg);
      setPendingAiMessage(null);
      setDisplayedAiResponse('');
    }
  };

  const scrollToBottom = () => {
    if (conversationContainerRef.current) {
      conversationContainerRef.current.scrollTo({
        top: conversationContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (conversationStarted) {
      scrollToBottom();
    }
  }, [chatMessages.length, conversationStarted, displayedAiResponse, pendingAiMessage, addMessage]);


  const handleQuickActionClick = (message) => {
    setCurrentQuestion(message);
  };

  const handleQuestionSubmit = async (newQuestion) => {
    // Prevent multiple requests
    if (isGenerating) return;

    // Add user message to context
    addMessage({ type: 'user', content: newQuestion });
    setCurrentQuestion('');
    
    setIsLoading(true);
    setError(null);

    // Create new AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      let response;
      
      // Check for abort before API call (sanity check)
      if (signal.aborted) return;

      switch (newQuestion) {
        case 'Draft a differential diagnosis based on the current patient context.':
          response = await apiClient.draftDDx(newQuestion, selectedPatient, signal);
          break;
        case 'Propose a management plan for a specific condition.':
          response = await apiClient.draftAssessmentPlan(newQuestion, selectedPatient, signal);
          break;
        case 'Summarize key patient information for handover.':
          response = await apiClient.draftHandoverSummary(newQuestion, selectedPatient, signal);
          break;
        case 'Draft a patient education summary.':
          response = await apiClient.draftPatientHandout(newQuestion, selectedPatient, signal);
          break;
        case 'Suggest initial diagnostic workup based on the current patient context.':
          response = await apiClient.draftDiagnosticWorkup(newQuestion, selectedPatient, signal);
          break;
        case 'Find evidence-based guidelines for [condition/treatment].':
          response = await apiClient.searchGuidelines(newQuestion, selectedPatient, signal);
          break;
        case 'Explain a medical concept or term.':
          response = await apiClient.explainConcept(newQuestion, selectedPatient, signal);
          break;
        case 'Provide a drug-drug interaction check for [medications].':
          response = await apiClient.checkDrugInteractions([], selectedPatient, signal);
          break;
        default:
          response = await apiClient.generateClinicalReasoning({
            userInput: newQuestion,
            patientContext: apiClient.formatPatientContext(selectedPatient)
          }, selectedPatient, signal);
      }

      // Check for abort after API call
      if (signal.aborted) return;

      if (response.ok) {
          let aiResponseContent = response.content;
          const aiReferences = response.references || [];
          const structured = response.structured;

          // ... (existing structured response formatting logic) ...
          if (structured && (!aiResponseContent || aiResponseContent.length < 50)) {
            if (structured.differentials) {
              aiResponseContent = `
                <div class="structured-response">
                  <h4>Differential Diagnosis</h4>
                  <ul>
                    ${structured.differentials.map(d => `
                      <li>
                        <strong>${d.condition}</strong> (${d.probability} Probability)
                        <br/><small>${d.rationale}</small>
                        ${d.workup ? `<br/><small><strong>Suggested Workup:</strong> ${d.workup}</small>` : ''}
                      </li>
                    `).join('')}
                  </ul>
                </div>
              `;
            } else if (structured.assessment && structured.plan && Array.isArray(structured.plan)) {
              aiResponseContent = `
                <div class="structured-response">
                  <h4>Assessment & Plan</h4>
                  <p><strong>Assessment:</strong> ${structured.assessment}</p>
                  <p><strong>Plan:</strong></p>
                  <ul>
                    ${structured.plan.map(p => `<li>${p}</li>`).join('')}
                  </ul>
                </div>
              `;
            } else if (structured.assessment && typeof structured.assessment === 'string' && !structured.plan) {
              // Handle Clinical Reasoning direct content if passed as structured
              aiResponseContent = `
                <div class="structured-response">
                  <h4>Clinical Assessment</h4>
                  <p>${structured.assessment}</p>
                  ${structured.diagnosis ? `
                    <p><strong>Primary Diagnosis:</strong> ${structured.diagnosis.main || structured.diagnosis}</p>
                  ` : ''}
                  ${structured.treatment ? `<p><strong>Treatment:</strong> ${structured.treatment}</p>` : ''}
                </div>
              `;
            } else if (structured.situation && structured.recommendation) {
              aiResponseContent = `
                <div class="structured-response">
                  <h4>Handover Summary</h4>
                  <p><strong>Situation:</strong> ${structured.situation}</p>
                  <p><strong>Background:</strong> ${structured.background}</p>
                  <p><strong>Assessment:</strong> ${structured.assessment}</p>
                  <p><strong>Recommendation:</strong> ${structured.recommendation}</p>
                </div>
              `;
            } else if (structured.overview && structured.whenToCallNurse) {
              aiResponseContent = `
                <div class="structured-response">
                  <h4>Patient Education: ${structured.title}</h4>
                  <p>${structured.overview}</p>
                  <p><strong>What we are doing:</strong> ${structured.whatWeAreDoing}</p>
                  <p><strong>When to call your nurse:</strong> ${structured.whenToCallNurse}</p>
                </div>
              `;
            } else if (structured.labs && structured.imaging) {
              aiResponseContent = `
                <div class="structured-response">
                  <h4>Recommended Diagnostic Workup</h4>
                  <p><strong>Labs:</strong> ${structured.labs.join(', ')}</p>
                  <p><strong>Imaging:</strong> ${structured.imaging.join(', ')}</p>
                  ${structured.advanced ? `<p><strong>Advanced:</strong> ${structured.advanced.join(', ')}</p>` : ''}
                </div>
              `;
            } else if (structured.results && Array.isArray(structured.results)) {
              aiResponseContent = `
                <div class="structured-response">
                  <h4>Search Results / Calculation</h4>
                  <ul>
                    ${structured.results.map(r => `
                      <li>
                        <strong>${r.title || r.concept || 'Result'}:</strong> ${r.value || r.definition || r.summary || ''}
                        ${r.unit ? ` ${r.unit}` : ''}
                        ${r.link ? `<br/><a href="${r.link}" target="_blank">View Source</a>` : ''}
                      </li>
                    `).join('')}
                  </ul>
                </div>
              `;
            } else if (structured.summary && Array.isArray(structured.summary)) {
              aiResponseContent = `
                <div class="structured-response">
                  <h4>Drug Interaction Check</h4>
                  <ul>
                    ${structured.summary.map(s => `
                      <li>
                        <strong class="severity-${s.severity}">${s.name}</strong>: ${s.explanation}
                      </li>
                    `).join('')}
                  </ul>
                </div>
              `;
            } else if (structured.concept && structured.definition) {
              aiResponseContent = `
                <div class="structured-response">
                  <h4>Clinical Concept: ${structured.concept}</h4>
                  <p>${structured.definition}</p>
                  <p><strong>Clinical Significance:</strong> ${structured.significance}</p>
                  ${structured.normalRange ? `<p><strong>Normal Range:</strong> ${structured.normalRange}</p>` : ''}
                </div>
              `;
            }
          } else if (typeof aiResponseContent === 'object' && aiResponseContent !== null) {
            // Fallback for generateClinicalReasoning direct content if it's still an object
            const { assessment, diagnosis, plan, treatment } = aiResponseContent;
            aiResponseContent = `
              <div class="structured-response">
                <p><strong>Assessment:</strong> ${assessment || ''}</p>
                ${diagnosis ? `
                  <p><strong>Primary Diagnosis:</strong> ${diagnosis.main || diagnosis}</p>
                  ${diagnosis.differential ? `<p><strong>Differential:</strong> ${diagnosis.differential.join(', ')}</p>` : ''}
                ` : ''}
                ${plan ? `<p><strong>Plan:</strong> ${plan}</p>` : ''}
                ${treatment ? `<p><strong>Treatment:</strong> ${treatment}</p>` : ''}
              </div>
            `.trim();
          }

          // Check for abort again before starting animation
          if (signal.aborted) return;

          // Initialize pending AI message
          setPendingAiMessage({ type: 'ai', content: '', fullHtmlContent: aiResponseContent, references: aiReferences, animating: true });
          
          setTimeout(() => {
            if (!signal.aborted) {
              setDisplayedAiResponse(aiResponseContent);
            }
          }, 500);
        } else {
        if (signal.aborted) return;
        const errorContent = response.content || 'System encountered an issue. Please try again.';
        setError(errorContent);
        // Add error message to context directly
        addMessage({ type: 'ai', content: errorContent, error: true });
      }

    } catch (err) {
      if (signal.aborted) return;
      console.error('Error in handleQuestionSubmit:', err);
      const errorMessage = 'System encountered an issue. Please try again.';
      setError(errorMessage);
      addMessage({ type: 'ai', content: errorMessage, error: true });
    } finally {
      // Only turn off isLoading if we haven't been aborted (abort handler handles it)
      // or if we are just finishing normally. 
      // Actually, if we are aborted, the abort handler sets isLoading(false).
      // If we finish normally, we set isLoading(false).
      if (!signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  const pendingAiMessageRef = useRef(pendingAiMessage);
  useEffect(() => {
    pendingAiMessageRef.current = pendingAiMessage;
  }, [pendingAiMessage]);

  useEffect(() => {
    if (pendingAiMessage?.animating && displayedAiResponse.length > 0) {
      let i = 0;
      // Define a threshold for "first few lines" (e.g., first 3 newlines or 150 characters)
      const newlineIndices = [];
      let pos = displayedAiResponse.indexOf('\n');
      while (pos !== -1 && newlineIndices.length < 3) {
        newlineIndices.push(pos);
        pos = displayedAiResponse.indexOf('\n', pos + 1);
      }
      const threshold = newlineIndices.length === 3 ? newlineIndices[2] : Math.min(150, displayedAiResponse.length);

      const typingInterval = setInterval(() => {
        let nextI = i;
        if (displayedAiResponse[i] === '<') {
            const tagEnd = displayedAiResponse.indexOf('>', i);
            if (tagEnd !== -1) {
            nextI = tagEnd + 1;
            } else {
            nextI = i + 1;
            }
        } else {
            // Determine how many characters to add in this step
            // Slow for the first few lines, then significantly faster
            const increment = i < threshold ? 1 : 15;
            nextI = i + increment;
        }
        
        i = nextI;

        if (i >= displayedAiResponse.length) {
            clearInterval(typingInterval);
            // Finalize message
            if (pendingAiMessageRef.current) {
                const finalMsg = { ...pendingAiMessageRef.current, content: displayedAiResponse, animating: false };
                addMessage(finalMsg);
            }
            setPendingAiMessage(null);
            setDisplayedAiResponse('');
        } else {
            setPendingAiMessage((prev) => {
                if (!prev) return null;
                return { ...prev, content: displayedAiResponse.substring(0, i) };
            });
        }
      }, 20); // Typing speed (milliseconds per character)

      return () => clearInterval(typingInterval);
    }
  }, [displayedAiResponse, pendingAiMessage?.animating, addMessage]);



  useEffect(() => {
    if (selectedPatient) {
      setChatContext({ type: 'SAVED_PATIENT_CHAT', patient: selectedPatient });
      startNewChat(); // Clear chat messages when patient context changes
    } else {
      setChatContext({ type: 'GENERAL_CHAT' });
      startNewChat(); // Clear chat messages when patient context changes
    }
  }, [selectedPatient, startNewChat]);

  const handleViewPatient = () => {
    if (selectedPatient) {
      setPatientToView(selectedPatient);
      setIsPatientDetailModalOpen(true);
    }
  };

  const handleClosePatientDetailModal = () => {
    setIsPatientDetailModalOpen(false);
    setPatientToView(null);
  };

  const handleEditPatient = (patientId) => {
    // This will likely navigate to an edit page or open an edit modal
    console.log(`Edit patient with ID: ${patientId}`);
    navigate(`/patient/${patientId}/edit`);
    handleClosePatientDetailModal();
  };

  const handleDetachPatient = () => {
    onUpdatePatient(null);
    deactivatePatientContextInSession();
    setChatContext({ type: 'GENERAL_CHAT' });
    startNewChat(); // Clear chat messages when patient context is detached
  };

  const handleSaveTemporaryPatient = () => {
    if (chatContext.type === 'TEMPORARY_PATIENT_CHAT' && chatContext.temporaryPatientContext) {
      const tempPatient = chatContext.temporaryPatientContext;
      const newPatient = addPatient({
        fullName: tempPatient.fullName || 'Temporary Patient',
        age: tempPatient.age,
        sex: tempPatient.sex,
        chiefComplaint: tempPatient.chiefComplaint,
        chronicConditions: tempPatient.chronicConditions,
        longTermMedications: tempPatient.longTermMedications,
        allergies: tempPatient.allergies,
        keyPastClinicalEvents: tempPatient.keyPastClinicalEvents,
        uploadedFiles: tempPatient.uploadedFiles,
        manualTextContext: tempPatient.freeTextContext,
      });
      setActivePatient(newPatient.id);
      setChatContext({ type: 'SAVED_PATIENT_CHAT', patient: newPatient });
      startNewChat(); // Clear chat messages after saving and switching context
    }
  };

  const handleCloseAccountPopup = () => {
    setIsAccountPopupOpen(false);
  };



  return (
    <div className="home-layout">
      <div className={`main-content-area`}>
        <div className={`main-content`}>
          <div className={`chat-area ${conversationStarted ? 'in-conversation' : ''}`}>
      {!conversationStarted && (
            <div className="question-input-container">
              <div className="hero-section">
                  <img src={dohrniiHeroIcon} alt="Jellyfish Icon" className="hero-icon" />
                  <h2 className="hero-title">Ask your medical questions</h2>
                  <p className="hero-subtitle">Get evidence-based information about symptoms, conditions, and treatments.</p>
              </div>
              <div className="question-input-form-container">
                <QuestionInput
                  onQuestionSubmit={handleQuestionSubmit}
                  currentQuestion={currentQuestion}
                  setCurrentQuestion={setCurrentQuestion}
                  isChatMode={false}
                  onExcludeContextChange={setExcludeContext}
                  excludeContext={excludeContext}
                  openConfirmationModal={openConfirmationModal}
                  isPatientContextActiveInSession={isPatientContextActiveInSession}
                  isConfirmationModalOpen={isConfirmationModalOpen}
                  patientToConfirmId={patientToConfirmId}
                  isConfirmingNewPatient={isConfirmingNewPatient}
                  closeConfirmationModal={closeConfirmationModal}
                  activatePatientContextInSession={activatePatientContextInSession}
                  deactivatePatientContextInSession={deactivatePatientContextInSession}
                  handleToggleSidebar={handleToggleSidebar}
                  isLoading={isGenerating}
                  onStop={handleStopResponse}
                />
                <QuickClinicalActions 
                  onActionClick={handleQuickActionClick} 
                  isChatMode={false} 
                  isLoading={isGenerating}
                />
              </div>
              <div className="explore-section">
                <h2 className="explore-title">Explore what Dohrnii can help with</h2>
                <div className="explore-cards">
                  <div className="explore-card" onClick={() => navigate('/clinical-reasoning')} style={{ backgroundColor: isDarkMode ? '#242626' : '#ffffff' }}>
                    <div className="explore-card-icon" style={{ backgroundColor: isDarkMode ? '#00968a42' : '#e8f7f6' }}>
                      <img src={clinicalReasoningIcon} alt="Clinical Reasoning" />
                    </div>
                    <div className="explore-card-content">
                      <h3 className="explore-card-title">Clinical Reasoning</h3>
                      <p className="explore-card-description">Get structured assessment and treatment plans</p>
                    </div>
                  </div>
                  <div className="explore-card" onClick={() => navigate('/visit-notes')} style={{ backgroundColor: isDarkMode ? '#242626' : '#ffffff' }}>
                    <div className="explore-card-icon" style={{ backgroundColor: isDarkMode ? '#00968a42' : '#e8f7f6' }}>
                      <img src={visitNotesIcon} alt="Visit Notes" />
                    </div>
                    <div className="explore-card-content">
                      <h3 className="explore-card-title">Visit Notes</h3>
                      <p className="explore-card-description">Turn patient conversations into clinical notes</p>
                    </div>
                  </div>
                  <div className="explore-card" onClick={() => navigate('/drug-safety')} style={{ backgroundColor: isDarkMode ? '#242626' : '#ffffff' }}>
                    <div className="explore-card-icon" style={{ backgroundColor: isDarkMode ? '#00968a42' : '#e8f7f6' }}>
                      <img src={drugSafetyIcon} alt="Drug Safety" />
                    </div>
                    <div className="explore-card-content">
                      <h3 className="explore-card-title">Drug Safety</h3>
                      <p className="explore-card-description">Check drug interactions and contraindications</p>
                    </div>
                  </div>
                  <div className="explore-card" onClick={() => navigate('/clinical-guidelines')} style={{ backgroundColor: isDarkMode ? '#242626' : '#ffffff' }}>
                    <div className="explore-card-icon" style={{ backgroundColor: isDarkMode ? '#00968a42' : '#e8f7f6' }}>
                      <img src={clinicalGuidelinesIcon} alt="Clinical Guidelines" />
                    </div>
                    <div className="explore-card-content">
                      <h3 className="explore-card-title">Clinical Guidelines</h3>
                      <p className="explore-card-description">Browse trusted medical guidelines</p>
                    </div>
                  </div>
                  <div className="explore-card" onClick={() => navigate('/calculators')} style={{ backgroundColor: isDarkMode ? '#242626' : '#ffffff' }}>
                    <div className="explore-card-icon" style={{ backgroundColor: isDarkMode ? '#00968a42' : '#e8f7f6' }}>
                      <img src={calculatorsIcon} alt="Calculators" />
                    </div>
                    <div className="explore-card-content">
                      <h3 className="explore-card-title">Calculators</h3>
                      <p className="explore-card-description">Use common clinical scoring tools</p>
                    </div>
                  </div>
                  <div className="explore-card" onClick={() => navigate('/differential-diagnosis')} style={{ backgroundColor: isDarkMode ? '#242626' : '#ffffff' }}>
                    <div className="explore-card-icon" style={{ backgroundColor: isDarkMode ? '#00968a42' : '#e8f7f6' }}>
                      <img src={differentialDiagnosisIcon} alt="Differential Diagnosis" />
                    </div>
                    <div className="explore-card-content">
                      <h3 className="explore-card-title">Differential Diagnosis</h3>
                      <p className="explore-card-description">Generate ranked diagnostic possibilities</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {conversationStarted && (
            <div className="chat-conversation-container" ref={conversationContainerRef}>
              {chatContext.type === 'GENERAL_CHAT' && (
                <div className="general-chat-context-info">
                  <p className="general-chat-helper-text">General discussion (no patient context attached)</p>
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
                </div>
              )}
              {chatContext.type === 'SAVED_PATIENT_CHAT' && (
                <div className="saved-patient-context-display">
                  <div className="patient-context-pill-container">
                    <div className="patient-context-pill">
                      <span>Using patient context · {chatContext.patient.fullName} · {chatContext.patient.age}Y {chatContext.patient.sex ? chatContext.patient.sex.charAt(0) : ''}</span>
                    </div>
                    <div className="patient-context-actions">
                      <button className="patient-context-action-button" onClick={handleViewPatient}>View</button>
                      <button className="patient-context-action-button" onClick={handleDetachPatient}>Detach</button>
                    </div>
                  </div>
                </div>
              )}
              {chatContext.type === 'TEMPORARY_PATIENT_CHAT' && (
                <div className="temporary-patient-context-display">
                  <div className="temporary-patient-context-container">
                    <div className="temporary-patient-pill">
                      <span>Temporary Context: {chatContext.temporaryContext.freeTextContext || 'Details available'}</span>
                    </div>
                    <div className="temporary-patient-actions">
                      <button className="temporary-patient-action-button use-once">Use once</button>
                      <button className="temporary-patient-action-button save-as-patient" onClick={handleSaveTemporaryPatient}>Save as patient</button>
                      <button className="temporary-patient-action-button cancel">Cancel</button>
                    </div>
                  </div>
                </div>
              )}
              <div className="answer-display">
                {chatMessages.map((message, index) => (
                  <div key={index} className={message.type === 'user' ? `user-message ${message.content.length < 100 ? 'user-message-short' : 'user-message-long'}` : 'ai-message'}>
                    {message.type === 'user' ? (
                      <div dangerouslySetInnerHTML={{ __html: message.content }}></div>
                    ) : (
                      <>
                        <div dangerouslySetInnerHTML={{ __html: message.content }}></div>
                        {message.animating && <span className="typing-cursor">|</span>}
                        {!message.animating && message.references && message.references.length > 0 && (
                          <div className="citations-section">
                            <h4 className="citations-title">
                              <img src={theme === 'light' ? referencesIconLight : referencesIconDark} alt="References" />
                              References
                            </h4>
                            <div className="citations-list">
                              {message.references.map((citation) => (
                                <div className="citation-card" key={citation.id}>
                                  <div className="citation-header">
                                    <span className="citation-number">{citation.id}.</span>
                                    <a href={citation.url} target="_blank" rel="noopener noreferrer" className="citation-title">
                                      {citation.title}
                                    </a>
                                  </div>
                                  <div className="citation-meta">
                                    {citation.authors}
                                  </div>
                                  <div className="citation-journal-year">
                                    {citation.journal} • {citation.year}
                                  </div>
                                  {citation.tags && citation.tags.length > 0 && (
                                    <div className="citation-tags">
                                      {citation.tags.map(tag => <span className="citation-tag" key={tag}>{tag}</span>)}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="ai-message loading">
                    <div className="loading-dots">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                )}
                {error && (
                  <div className="error-message-container">
                    <p className="error-message">{error}</p>
                    <button className="retry-button" onClick={() => handleQuestionSubmit(chatMessages[chatMessages.length - 1]?.content)}>Retry</button>
                  </div>
                )}
              </div>
            </div>
          )}
          {conversationStarted && (
            <div className="question-input-container fixed-bottom">
              <QuestionInput 
                onQuestionSubmit={handleQuestionSubmit} 
                currentQuestion={currentQuestion} 
                setCurrentQuestion={setCurrentQuestion} 
                isChatMode={true} 
                onExcludeContextChange={setExcludeContext} 
                excludeContext={excludeContext} 
                openConfirmationModal={openConfirmationModal} 
                isPatientContextActiveInSession={isPatientContextActiveInSession} 
                isConfirmationModalOpen={isConfirmationModalOpen} 
                patientToConfirmId={patientToConfirmId} 
                isConfirmingNewPatient={isConfirmingNewPatient} 
                closeConfirmationModal={closeConfirmationModal} 
                activatePatientContextInSession={activatePatientContextInSession} 
                deactivatePatientContextInSession={deactivatePatientContextInSession} 
                handleToggleSidebar={handleToggleSidebar}
                isLoading={isGenerating}
                onStop={handleStopResponse}
              />
              <QuickClinicalActions 
                onActionClick={handleQuickActionClick} 
                isChatMode={true}
                isLoading={isGenerating}
              />
            </div>
          )}
        </div>
        </div>
      </div>

      <AccountPopup isOpen={isAccountPopupOpen} onClose={handleCloseAccountPopup} user={user} onLogout={onLogout} />
      {isPatientDetailModalOpen && patientToView && (
        <PatientDetailModal
          patient={patientToView}
          onClose={handleClosePatientDetailModal}
          onEdit={handleEditPatient}
        />
      )}
    </div>
  );
};

export default Home;