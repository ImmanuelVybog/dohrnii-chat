import { useState, useEffect } from 'react';
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


  const handleQuickActionClick = (message) => {
    setCurrentQuestion(message);
    handleQuestionSubmit(message);
  };

  const handleQuestionSubmit = (newQuestion) => {
    setChatMessages((prevMessages) => [...prevMessages, { type: 'user', content: newQuestion }]);
    setCurrentQuestion('');
    setConversationStarted(true);

    // Simulate AI response with references
    let aiResponseContent;
    let aiReferences = [];

    switch (newQuestion) {
      case 'Draft a differential diagnosis based on the current patient context.':
        aiResponseContent = `**Differential Diagnosis for Current Patient Context:**

Based on the available patient information, here are some potential differential diagnoses to consider:

1.  **Community-Acquired Pneumonia (CAP):** Given symptoms like cough, fever, and potential respiratory distress.
    *   *Key considerations:* Chest X-ray findings, oxygen saturation, sputum culture.
    *   *References:*
        *   Mandell, Douglas, and Bennett's Principles and Practice of Infectious Diseases. 9th ed.
        *   IDSA Guidelines for the Management of CAP in Adults.

2.  **Acute Bronchitis:** If cough is prominent but without clear evidence of pneumonia.
    *   *Key considerations:* Viral prodrome, absence of infiltrates on imaging.
    *   *References:*
        *   UpToDate: Acute bronchitis in adults.

3.  **Congestive Heart Failure (CHF) Exacerbation:** If there's a history of cardiac issues and new or worsening dyspnea.
    *   *Key considerations:* Jugular venous distension, peripheral edema, BNP levels, echocardiogram.
    *   *References:*
        *   ACC/AHA Guidelines for the Management of Heart Failure.

4.  **Pulmonary Embolism (PE):** Especially if there are risk factors (e.g., recent surgery, immobility, malignancy) and sudden onset dyspnea/chest pain.
    *   *Key considerations:* D-dimer, CT pulmonary angiography.
    *   *References:*
        *   ACCP Guidelines for Antithrombotic Therapy and Prevention of Thrombosis.

*Please note: This is a simulated response for educational purposes and should not be used for actual patient care. Always refer to official guidelines and patient-specific data.*`;
        aiReferences = [
          { id: 1, title: 'IDSA Guidelines for the Management of Community-Acquired Pneumonia in Adults', journal: 'Clinical Infectious Diseases', authors: 'Metlay JP, et al.', year: '2019', url: 'https://www.idsociety.org/CAPguidelines', tags: ['Guideline', 'Infectious Disease'] },
          { id: 2, title: 'ACC/AHA Guideline for the Management of Heart Failure', journal: 'Journal of the American College of Cardiology', authors: 'Yancy CW, et al.', year: '2017', url: 'https://www.ahajournals.org/heartfailureguideline', tags: ['Guideline', 'Cardiology'] },
        ];
        break;

      case 'Suggest initial diagnostic workup based on the current patient context.':
        aiResponseContent = `**Initial Diagnostic Workup for Current Patient Context:**

Based on the available patient information, here's a suggested initial diagnostic workup:

1.  **Laboratory Tests:**
    *   Complete Blood Count (CBC) with differential
    *   Basic Metabolic Panel (BMP)
    *   Liver Function Tests (LFTs)
    *   Inflammatory markers (CRP, ESR)
    *   Cardiac enzymes (if chest pain/dyspnea)
    *   D-dimer (if PE suspected)
    *   Blood cultures (if fever/sepsis suspected)

2.  **Imaging Studies:**
    *   Chest X-ray (CXR) - PA and Lateral
    *   Electrocardiogram (ECG)
    *   Consider Point-of-Care Ultrasound (POCUS) for cardiac or pulmonary assessment.

3.  **Other:**
    *   Urinalysis and urine culture (if UTI suspected)
    *   Sputum gram stain and culture (if productive cough)

*Please note: This is a simulated response for educational purposes and should not be used for actual patient care. Always refer to official guidelines and patient-specific data.*`;
        aiReferences = [
          { id: 1, title: 'Emergency Medicine: A Comprehensive Study Guide', journal: 'McGraw Hill', authors: 'Tintinalli JE, et al.', year: '2020', url: 'https://accessmedicine.mhmedical.com/tintinalli', tags: ['Textbook', 'Emergency Medicine'] },
          { id: 2, title: 'Clinical Decision Support: The Road to Better Patient Care', journal: 'Elsevier', authors: 'Greenes RA, et al.', year: '2014', url: 'https://www.elsevier.com/clinical-decision-support', tags: ['Review', 'Health Informatics'] },
        ];
        break;

      case 'Propose a management plan for a specific condition.':
        aiResponseContent = `**Proposed Management Plan for [Specific Condition - e.g., Community-Acquired Pneumonia]:**

Assuming a diagnosis of Community-Acquired Pneumonia (CAP) in an adult patient with no significant comorbidities and outpatient management is appropriate:

1.  **Antibiotic Therapy:**
    *   **First-line:** Amoxicillin 1g TID OR Doxycycline 100mg BID OR Azithromycin 500mg on day 1, then 250mg daily for 4 days.
    *   *Duration:* Typically 5-7 days, or until afebrile for 48-72 hours.

2.  **Symptomatic Treatment:**
    *   Antipyretics/Analgesics: Acetaminophen or Ibuprofen for fever and pain.
    *   Cough suppressants: As needed for bothersome cough.
    *   Hydration: Encourage oral fluid intake.

3.  **Monitoring & Follow-up:**
    *   Educate patient on warning signs (worsening dyspnea, persistent fever, altered mental status) requiring immediate medical attention.
    *   Follow-up in 24-48 hours (phone call or in-person) to assess response to treatment.
    *   Consider repeat Chest X-ray in 4-6 weeks for patients over 50 years old or smokers to rule out underlying malignancy.

*Please note: This is a simulated response for educational purposes and should not be used for actual patient care. Always refer to official guidelines and patient-specific data.*`;
        aiReferences = [
          { id: 1, title: 'IDSA/ATS Guidelines for the Management of Community-Acquired Pneumonia in Adults', journal: 'Clinical Infectious Diseases', authors: 'Metlay JP, et al.', year: '2019', url: 'https://www.idsociety.org/CAPguidelines', tags: ['Guideline', 'Infectious Disease'] },
          { id: 2, title: 'NICE Guideline: Pneumonia (community-acquired): antimicrobial prescribing', journal: 'National Institute for Health and Care Excellence', authors: 'NICE', year: '2019', url: 'https://www.nice.org.uk/guidance/ng138', tags: ['Guideline', 'UK Healthcare'] },
        ];
        break;

      case 'Summarize key patient information for handover.':
        aiResponseContent = `**Patient Handover Summary:**

**Patient Name:** [Patient Name from Context, e.g., John Doe]
**Age/Sex:** [Age/Sex from Context, e.g., 68M]
**Chief Complaint:** [Chief Complaint from Context, e.g., Shortness of breath]
**Brief HPI:** [Brief History of Present Illness from Context, e.g., 3 days of progressive dyspnea, productive cough, subjective fevers. No chest pain. Denies recent travel or sick contacts.]
**Relevant PMH:** [Relevant Past Medical History from Context, e.g., CAD, HTN, Type 2 DM, COPD]
**Current Status:** [e.g., Alert and oriented x3, tachypneic at rest (RR 24), O2 sat 92% on room air, coarse breath sounds bilaterally. Afebrile.]
**Pending/Recent Labs/Imaging:** [e.g., CXR shows bilateral lower lobe infiltrates. CBC: WBC 14.5, Hgb 13.2. BMP WNL. Blood cultures sent.]
**Assessment:** [e.g., Community-Acquired Pneumonia, COPD exacerbation]
**Plan:** [e.g., Start IV Ceftriaxone and Azithromycin. Respiratory treatments. Monitor O2 sats. Consult Pulmonology.]

*Please note: This is a simulated response for educational purposes and should not be used for actual patient care. Always refer to official guidelines and patient-specific data.*`;
        aiReferences = [
          { id: 1, title: 'SBAR Communication: An Effective Tool for Handoff in Nursing', journal: 'Journal of Nursing Care Quality', authors: 'Haig KM, et al.', year: '2006', url: 'https://journals.lww.com/jncq/Abstract/2006/07000/SBAR_Communication__An_Effective_Tool_for_Handoff.10.aspx', tags: ['Communication', 'Nursing'] },
          { id: 2, title: 'Patient Handoffs: A Review of the Literature', journal: 'Journal of Hospital Medicine', authors: 'Starmer AJ, et al.', year: '2013', url: 'https://www.journalofhospitalmedicine.com/jhospmed/article/123456/patient-handoffs-review-literature', tags: ['Patient Safety', 'Review'] },
        ];
        break;

      case 'Draft a patient education summary.':
        aiResponseContent = `**Patient Education Summary for [Condition - e.g., New Diagnosis of Type 2 Diabetes]:**

**What is Type 2 Diabetes?**
Type 2 diabetes is a condition where your body either doesn't produce enough insulin or doesn't use insulin properly. Insulin is a hormone that helps sugar (glucose) get into your cells to be used for energy. When this process doesn't work well, sugar builds up in your blood, which can lead to health problems over time.

**Key Management Strategies:**

1.  **Healthy Eating:** Focus on a balanced diet with plenty of vegetables, lean proteins, and whole grains. Limit sugary drinks, processed foods, and unhealthy fats. Consider consulting with a dietitian.
2.  **Regular Physical Activity:** Aim for at least 150 minutes of moderate-intensity aerobic activity per week (e.g., brisk walking, swimming).
3.  **Medications:** Take your prescribed medications (e.g., metformin, insulin) exactly as directed. Understand their purpose and potential side effects.
4.  **Blood Glucose Monitoring:** Regularly check your blood sugar levels as advised by your doctor. This helps you understand how food, activity, and medication affect your glucose.
5.  **Foot Care:** Inspect your feet daily for cuts, sores, or blisters. Wear comfortable, well-fitting shoes.
6.  **Regular Check-ups:** Attend all appointments with your healthcare team, including eye exams and kidney function tests.

**When to Seek Medical Attention:**
Contact your doctor if you experience symptoms of very high or very low blood sugar, or any new concerning symptoms.

*Please note: This is a simulated response for educational purposes and should not be used for actual patient care. Always refer to official guidelines and patient-specific data.*`;
        aiReferences = [
          { id: 1, title: 'American Diabetes Association: Standards of Medical Care in Diabetes', journal: 'Diabetes Care', authors: 'ADA', year: '2024', url: 'https://diabetesjournals.org/care/issue/current', tags: ['Guideline', 'Endocrinology'] },
          { id: 2, title: 'National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK): Diabetes Information', journal: 'NIH', authors: 'NIDDK', year: 'Current', url: 'https://www.niddk.nih.gov/health-information/diabetes', tags: ['Patient Education', 'Government Resource'] },
        ];
        break;

      case 'Find evidence-based guidelines for [condition/treatment].':
        aiResponseContent = `**Evidence-Based Guidelines for [Condition/Treatment - e.g., Hypertension Management]:**

Here are some prominent evidence-based guidelines for hypertension management:

1.  **2017 ACC/AHA Guideline for the Prevention, Detection, Evaluation, and Management of High Blood Pressure in Adults:**
    *   *Key recommendations:* Defines hypertension as BP ≥130/80 mmHg. Emphasizes lifestyle modifications and provides algorithms for pharmacologic treatment based on risk.
    *   *Source:* American College of Cardiology / American Heart Association
    *   *Link:* [https://www.ahajournals.org/doi/full/10.1161/HYP.0000000000000065](https://www.ahajournals.org/doi/full/10.1161/HYP.0000000000000065)

2.  **NICE Guideline: Hypertension in adults: diagnosis and management (NG136):**
    *   *Key recommendations:* Focuses on clinic and ambulatory/home BP monitoring for diagnosis. Provides guidance on drug treatment and monitoring.
    *   *Source:* National Institute for Health and Care Excellence (UK)
    *   *Link:* [https://www.nice.org.uk/guidance/ng136](https://www.nice.org.uk/guidance/ng136)

3.  **ESH/ESC Guidelines for the management of arterial hypertension:**
    *   *Key recommendations:* European guidelines offering comprehensive advice on diagnosis, treatment, and follow-up of hypertension.
    *   *Source:* European Society of Hypertension / European Society of Cardiology
    *   *Link:* [https://academic.oup.com/eurheartj/article/39/33/3021/5081210](https://academic.oup.com/eurheartj/article/39/33/3021/5081210)

*Please note: This is a simulated response for educational purposes and should not be used for actual patient care. Always refer to official guidelines and patient-specific data.*`;
        aiReferences = [
          { id: 1, title: '2017 ACC/AHA Guideline for the Prevention, Detection, Evaluation, and Management of High Blood Pressure in Adults', journal: 'Hypertension', authors: 'Whelton PK, et al.', year: '2018', url: 'https://www.ahajournals.org/doi/full/10.1161/HYP.0000000000000065', tags: ['Guideline', 'Cardiology'] },
          { id: 2, title: 'NICE Guideline: Hypertension in adults: diagnosis and management (NG136)', journal: 'NICE', authors: 'NICE', year: '2019', url: 'https://www.nice.org.uk/guidance/ng136', tags: ['Guideline', 'UK Healthcare'] },
        ];
        break;

      case 'Explain a medical concept or term.':
        aiResponseContent = `**Explanation of [Medical Concept/Term - e.g., "Myocardial Infarction"]:**

A **myocardial infarction (MI)**, commonly known as a **heart attack**, occurs when blood flow to a part of the heart muscle is blocked for a prolonged period, usually by a blood clot. This blockage prevents oxygen from reaching the heart muscle, leading to damage or death of the heart tissue.

**Key Points:**

*   **Cause:** Most commonly caused by a rupture of an atherosclerotic plaque in a coronary artery, leading to clot formation.
*   **Symptoms:** Can include chest pain (often described as pressure, tightness, or squeezing), shortness of breath, pain radiating to the arm (especially left), jaw, back, or stomach, sweating, nausea, and lightheadedness.
*   **Diagnosis:** Typically involves an electrocardiogram (ECG) to detect electrical changes in the heart, and blood tests to measure cardiac enzymes (e.g., troponin), which are released when heart muscle is damaged.
*   **Treatment:** Immediate treatment focuses on restoring blood flow (e.g., angioplasty with stent placement, thrombolytic medications) and managing symptoms. Long-term management involves medications (e.g., antiplatelets, statins, beta-blockers) and lifestyle changes.

*Please note: This is a simulated response for educational purposes and should not be used for actual patient care. Always refer to official guidelines and patient-specific data.*`;
        aiReferences = [
          { id: 1, title: 'Braunwald\'s Heart Disease: A Textbook of Cardiovascular Medicine', journal: 'Elsevier', authors: 'Zipes DP, et al.', year: '2018', url: 'https://www.elsevier.com/braunwalds-heart-disease', tags: ['Textbook', 'Cardiology'] },
          { id: 2, title: 'AHA: About Heart Attacks', journal: 'American Heart Association', authors: 'AHA', year: 'Current', url: 'https://www.heart.org/en/health-topics/heart-attack/about-heart-attacks', tags: ['Patient Education', 'Cardiology'] },
        ];
        break;

      case 'Provide a drug-drug interaction check for [medications].':
        aiResponseContent = `**Drug-Drug Interaction Check for [Medications - e.g., Warfarin and Trimethoprim-Sulfamethoxazole]:**

**Medications:**
1.  **Warfarin (Coumadin)**: Anticoagulant
2.  **Trimethoprim-Sulfamethoxazole (Bactrim)**: Antibiotic

**Interaction:**
**Severity:** Major
**Mechanism:** Trimethoprim-sulfamethoxazole can inhibit the metabolism of warfarin (specifically via CYP2C9 inhibition) and also displace warfarin from plasma protein binding sites. Both mechanisms lead to increased levels of active warfarin in the blood.
**Effect:** Significantly increases the anticoagulant effect of warfarin, leading to a **higher risk of bleeding**.

**Recommendations:**
*   **Avoid concomitant use if possible.**
*   If co-administration is unavoidable, **close monitoring of INR (International Normalized Ratio) is essential**, typically daily for the first few days, then every 2-3 days.
*   **Adjust warfarin dose downwards** significantly (e.g., by 30-50%) when starting trimethoprim-sulfamethoxazole, and titrate based on INR.
*   Educate the patient on signs and symptoms of bleeding (e.g., unusual bruising, nosebleeds, blood in urine/stool, prolonged bleeding from cuts).
*   Consider alternative antibiotics if appropriate.

*Please note: This is a simulated response for educational purposes and should not be used for actual patient care. Always refer to official drug interaction databases and patient-specific data.*`;
        aiReferences = [
          { id: 1, title: 'Lexicomp Drug Interactions', journal: 'Wolters Kluwer', authors: 'Lexicomp', year: 'Current', url: 'https://www.wolterskluwer.com/en/solutions/lexicomp', tags: ['Drug Database', 'Pharmacology'] },
          { id: 2, title: 'UpToDate: Warfarin: Drug interactions', journal: 'UpToDate', authors: 'Crowther MA, et al.', year: 'Current', url: 'https://www.uptodate.com/contents/warfarin-drug-interactions', tags: ['Clinical Resource', 'Pharmacology'] },
        ];
        break;

      default:
        if (excludeContext || chatContext.type === 'GENERAL_CHAT') {
          aiResponseContent = `This is a simulated AI answer for: "${newQuestion}". In General Chat mode, responses are generic and do not use patient context.`;
        } else if (chatContext.type === 'SAVED_PATIENT_CHAT' && selectedPatient) {
          aiResponseContent = `This is a simulated AI answer for: "${newQuestion}" in the context of patient ${selectedPatient.name} (ID: ${selectedPatient.id}, Age: ${selectedPatient.age}, Sex: ${selectedPatient.sex}). The AI is referencing the patient's data.`;
        } else if (chatContext.type === 'TEMPORARY_PATIENT_CHAT' && chatContext.temporaryPatientContext) {
          const tempPatient = chatContext.temporaryPatientContext;
          aiResponseContent = `This is a simulated AI answer for: "${newQuestion}" using temporary patient context (Age: ${tempPatient.age}, Sex: ${tempPatient.sex}, Chief Complaint: ${tempPatient.chiefComplaint}). The AI is referencing this temporary data.`;
        } else {
          aiResponseContent = `This is a simulated AI answer for: "${newQuestion}".\n\nReferences:\n1. Reference A: https://example.com/referenceA\n2. Reference B: https://example.com/referenceB`;
        }
        aiReferences = [
          { id: 1, title: '2024 update of the AGIHO guideline on diagnosis and empirical treatment of fever of unknown origin (FUO) in adult neutropenic patients with solid tumours and hematological malignancies.', journal: 'The Lancet regional health. Europe. 2025.', authors: 'Sandherr M, Stemler J, Schalk E et al.', year: '2025', url: 'https://example.com/ref1', tags: ['Newly Published'] },
          { id: 2, title: 'Clinical practice guideline for the use of antimicrobial agents in neutropenic patients with cancer: 2010 update by the infectious diseases society of america.', journal: 'Clinical infectious diseases : an official publication of the Infectious Diseases Society of America. 2011.', authors: 'Freifeld AG, Bow EJ, Sepkowitz KA et al.', year: '2011', url: 'https://example.com/ref2', tags: ['High Impact', 'Highly Cited'] },
        ];
        break;
    }

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
      // Define a threshold for "first few lines" (e.g., first 3 newlines or 150 characters)
      const newlineIndices = [];
      let pos = displayedAiResponse.indexOf('\n');
      while (pos !== -1 && newlineIndices.length < 3) {
        newlineIndices.push(pos);
        pos = displayedAiResponse.indexOf('\n', pos + 1);
      }
      const threshold = newlineIndices.length === 3 ? newlineIndices[2] : Math.min(150, displayedAiResponse.length);

      const typingInterval = setInterval(() => {
        setChatMessages((prevMessages) => {
          const newMessages = [...prevMessages];
          if (newMessages[typingMessageIndex]) {
            newMessages[typingMessageIndex].content = displayedAiResponse.substring(0, i);
          }
          return newMessages;
        });

        // Determine how many characters to add in this step
        // Slow for the first few lines, then significantly faster
        const increment = i < threshold ? 1 : 15;
        i += increment;

        if (i >= displayedAiResponse.length) {
          clearInterval(typingInterval);
          setChatMessages((prevMessages) => {
            const newMessages = [...prevMessages];
            if (newMessages[typingMessageIndex]) {
              newMessages[typingMessageIndex].animating = false;
              // Ensure the full content is set correctly at the end
              newMessages[typingMessageIndex].content = displayedAiResponse;
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
    navigate(`/patient/${patientId}/edit`);
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
                  handleToggleSidebar={handleToggleSidebar} />
                <QuickClinicalActions onActionClick={handleQuickActionClick} isChatMode={false} />
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
            </div>
          )}
          {conversationStarted && (
            <div className="question-input-container fixed-bottom">
              <QuestionInput onQuestionSubmit={handleQuestionSubmit} currentQuestion={currentQuestion} setCurrentQuestion={setCurrentQuestion} isChatMode={true} onExcludeContextChange={setExcludeContext} excludeContext={excludeContext} openConfirmationModal={openConfirmationModal} isPatientContextActiveInSession={isPatientContextActiveInSession} isConfirmationModalOpen={isConfirmationModalOpen} patientToConfirmId={patientToConfirmId} isConfirmingNewPatient={isConfirmingNewPatient} closeConfirmationModal={closeConfirmationModal} activatePatientContextInSession={activatePatientContextInSession} deactivatePatientContextInSession={deactivatePatientContextInSession} handleToggleSidebar={handleToggleSidebar} />
              <QuickClinicalActions onActionClick={handleQuickActionClick} isChatMode={true} />
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