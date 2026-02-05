import { useState, useEffect } from 'react';
import './Home.css';
import QuestionInput from '../components/QuestionInput';
import AccountPopup from '../components/AccountPopup';
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
import { addPatient, setActivePatient } from '../services/patientService';
import { useNavigate } from 'react-router-dom';
import PatientDetailModal from '../components/PatientDetailModal/PatientDetailModal';
import GlobalPatientSelector from '../components/GlobalPatientSelector/GlobalPatientSelector';




const Home = ({ openConfirmationModal, isPatientContextActiveInSession, isConfirmationModalOpen, patientToConfirmId, isConfirmingNewPatient, closeConfirmationModal, activatePatientContextInSession, deactivatePatientContextInSession, isSidebarOpen, handleToggleSidebar, handleExpandPatientSection, isAuthenticated, user, onLogout }) => {

  const navigate = useNavigate();
  const { theme, isDarkMode } = useTheme();
  const [chatMessages, setChatMessages] = useState([]);

  const [currentQuestion, setCurrentQuestion] = useState('');

  const [conversationStarted, setConversationStarted] = useState(false);
  const [typingMessageIndex, setTypingMessageIndex] = useState(null);
  const [displayedAiResponse, setDisplayedAiResponse] = useState('');
  const [isAccountPopupOpen, setIsAccountPopupOpen] = useState(false);
  const [excludeContext, setExcludeContext] = useState(false);
  const [chatContext, setChatContext] = useState({ type: 'GENERAL_CHAT' });
  const [isPatientDetailModalOpen, setIsPatientDetailModalOpen] = useState(false);
  const [patientToView, setPatientToView] = useState(null);





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
    let aiResponseContent;
    if (excludeContext || chatContext.type === 'GENERAL_CHAT') {
      aiResponseContent = `This is a simulated AI answer for: "${newQuestion}". In General Chat mode, responses are generic and do not use patient context.`;
    } else if (chatContext.type === 'SAVED_PATIENT_CHAT' && selectedPatient) {
      aiResponseContent = `This is a simulated AI answer for: "${newQuestion}" in the context of patient ${selectedPatient.name} (ID: ${selectedPatient.id}, Age: ${selectedPatient.age}, Sex: ${selectedPatient.sex}). The AI is referencing the patient's data.`;
    } else if (chatContext.type === 'TEMPORARY_PATIENT_CHAT' && chatContext.temporaryPatientContext) {
      const tempPatient = chatContext.temporaryPatientContext;
      aiResponseContent = `This is a simulated AI answer for: "${newQuestion}" using temporary patient context (Age: ${tempPatient.age}, Sex: ${tempPatient.sex}, Chief Complaint: ${tempPatient.chiefComplaint}). The AI is referencing this temporary data.`;
    } else if (newQuestion === 'What is the first-line empiric antibiotic for neutropenic fever?') {
            aiResponseContent = `
        <p>Monotherapy with an antipseudomonal beta-lactam agent is the first-line empiric antibiotic for neutropenic fever.</p>
        <h3>Recommended First-Line Agents</h3>
        <ul>
          <li>Cefepime 2000 mg IV every 8 hours</li>
          <li>Piperacillin-tazobactam 4000/500 mg IV every 6 hours</li>
          <li>Ceftazidime 2000 mg IV every 8 hours</li>
          <li>Meropenem 1000 mg IV every 6 hours (second-line or for high-risk patients)</li>
          <li>Imipenem-cilastatin 500/500 mg IV every 6 hours (second-line or for high-risk patients)</li>
        </ul>
        <h3>Key Principles</h3>
        <ul>
          <li>Empiric antibiotics should be administered within 1 hour of presentation after obtaining appropriate cultures.</li>
          <li>Monotherapy is preferred over combination therapy for initial empiric treatment in most patients.</li>
          <li>The choice among first-line agents should be guided by local antibiotic resistance patterns, patient-specific risk factors, and previous colonization or infection history.</li>
          <li>Vancomycin or other anti-Gram-positive coverage is NOT recommended as part of routine initial empiric therapy unless specific indications exist (catheter-related infection, skin/soft tissue infection, severe pneumonia, or hemodynamic instability).</li>
          <li>Patients already on fluoroquinolone prophylaxis should not receive a fluoroquinolone as part of empiric therapy.</li>
        </ul>
        <h3>Risk-Based Modifications</h3>
        <ul>
          <li>High-risk patients (expected neutropenia >7 days) require inpatient IV therapy with the agents listed above.</li>
          <li>Low-risk patients (MASCC score ≥21) may be candidates for oral outpatient therapy with ciprofloxacin plus amoxicillin-clavulanate after initial observation.</li>
          <li>Patients colonized with resistant organisms (ESBL, carbapenem-resistant bacteria) may require carbapenem therapy or other targeted agents as initial empiric treatment.</li>
        </ul>
        <p>Would you like me to discuss modifications to empiric therapy based on specific clinical scenarios or patient risk factors?</p>
      `;
    } else {
      aiResponseContent = `This is a simulated AI answer for: "${newQuestion}".\n\nReferences:\n1. Reference A: https://example.com/referenceA\n2. Reference B: https://example.com/referenceB`;
    }

    const aiReferences = [
      { id: 1, title: '2024 update of the AGIHO guideline on diagnosis and empirical treatment of fever of unknown origin (FUO) in adult neutropenic patients with solid tumours and hematological malignancies.', journal: 'The Lancet regional health. Europe. 2025.', authors: 'Sandherr M, Stemler J, Schalk E et al.', year: '2025', url: 'https://example.com/ref1', tags: ['Newly Published'] },
      { id: 2, title: 'Clinical practice guideline for the use of antimicrobial agents in neutropenic patients with cancer: 2010 update by the infectious diseases society of america.', journal: 'Clinical infectious diseases : an official publication of the Infectious Diseases Society of America. 2011.', authors: 'Freifeld AG, Bow EJ, Sepkowitz KA et al.', year: '2011', url: 'https://example.com/ref2', tags: ['High Impact', 'Highly Cited'] },
      { id: 3, title: 'Outpatient Management of Fever and Neutropenia in Adults Treated for Malignancy: American Society of Clinical Oncology and Infectious Diseases Society of America Clinical Practice Guideline Update.', journal: 'Journal of clinical oncology : official journal of the American Society of Clinical Oncology. 2018.', authors: 'Taplitz RA, Kennedy EB, Bow EJ et al.', year: '2018', url: 'https://example.com/ref3', tags: ['Guideline', 'High Impact', 'Highly Cited'] },
      { id: 4, title: 'Rapid Fire: Infectious Disease Emergencies in Patients with Cancer.', journal: 'Emergency medicine clinics of North America. 2018.', authors: 'Charshafian S, Liang SY', year: '2018', url: 'https://example.com/ref4', tags: [] },
      { id: 5, title: 'Management of fever and neutropenia in patients with cancer.', journal: 'Journal of oncology practice. 2015.', authors: 'Klastersky J', year: '2015', url: 'https://example.com/ref5', tags: ['Guideline', 'High Impact', 'Highly Cited'] },
    ];

    // Add a placeholder for the AI response and start typing animation
    setChatMessages((prevMessages) => {
      const newMessages = [...prevMessages, { type: 'ai', content: '', fullHtmlContent: aiResponseContent, references: aiReferences, animating: true }];
      setTypingMessageIndex(newMessages.length - 1);
      return newMessages;
    });

    setTimeout(() => {
      setDisplayedAiResponse(aiResponseContent);
    }, 500); // Simulate a small delay before AI starts typing
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



  const { selectedPatient } = usePatientContext();

  useEffect(() => {
    if (selectedPatient) {
      setChatContext({ type: 'SAVED_PATIENT_CHAT', patient: selectedPatient });
      setChatMessages([]); // Clear chat messages when patient context changes
    } else {
      setChatContext({ type: 'GENERAL_CHAT' });
      setChatMessages([]); // Clear chat messages when patient context changes
    }
  }, [selectedPatient]);







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
    navigate(`/patient/${patientId}/edit`); // Example navigation
    handleClosePatientDetailModal();
  };

  const handleDetachPatient = () => {
    setActivePatient(null);
    setChatContext({ type: 'GENERAL_CHAT' });
    setChatMessages([]); // Clear chat messages when patient context is detached
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
      setChatMessages([]); // Clear chat messages after saving and switching context
    }
  };

  const handleCloseAccountPopup = () => {
    setIsAccountPopupOpen(false);
  };



  return (
    <div className="home-layout">
      <div className={`main-content-area`}>
        <div className={`main-content`}>
          <div className="chat-area">
          {!conversationStarted && (
            <div className="question-input-container">
              <div className="hero-section">
                  <img src={dohrniiHeroIcon} alt="Jellyfish Icon" className="hero-icon" />
                  <h2 className="hero-title">Ask your medical questions</h2>
                  <p className="hero-subtitle">Get evidence-based information about symptoms, conditions, and treatments.</p>
              </div>
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
                handleToggleSidebar={handleToggleSidebar} />   
              <div className="suggestion-buttons">
                  <button onClick={() => handleSuggestionClick('Symptoms of diabetes?')} className="suggestion-button">Symptoms of diabetes?</button>
                  <button onClick={() => handleSuggestionClick('How does high BP affect the body?')} className="suggestion-button">How does high BP affect the body?</button>
                  <button onClick={() => handleSuggestionClick('What should I know about antibiotics?')} className="suggestion-button">What should I know about antibiotics?</button>
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
            <div className="chat-conversation-container">
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
                  <div key={index} className={message.type === 'user' ? 'user-message' : 'ai-message'}>
                    {message.type === 'user' ? (
                      <p dangerouslySetInnerHTML={{ __html: message.content }}></p>
                    ) : (
                      <>
                        {message.animating ? (
                          <p dangerouslySetInnerHTML={{ __html: message.content }}></p>
                        ) : (
                          <p dangerouslySetInnerHTML={{ __html: message.fullHtmlContent }}></p>
                        )}
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
              </div>
              <div className="question-input-container fixed-bottom">
                <QuestionInput onQuestionSubmit={handleQuestionSubmit} currentQuestion={currentQuestion} setCurrentQuestion={setCurrentQuestion} isChatMode={true} onExcludeContextChange={setExcludeContext} excludeContext={excludeContext} openConfirmationModal={openConfirmationModal} isPatientContextActiveInSession={isPatientContextActiveInSession} isConfirmationModalOpen={isConfirmationModalOpen} patientToConfirmId={patientToConfirmId} isConfirmingNewPatient={isConfirmingNewPatient} closeConfirmationModal={closeConfirmationModal} activatePatientContextInSession={activatePatientContextInSession} deactivatePatientContextInSession={deactivatePatientContextInSession} handleToggleSidebar={handleToggleSidebar} />
              </div>
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