import React, { useState, useEffect, useRef, useCallback } from 'react';
import './PatientSelectionModal.css';
import { getAllPatients, setActivePatient, addPatient, deletePatient } from '../../services/patientService';
import { Patient, Sex, UploadedFile } from '../../types/patient';
import { usePatientContext } from '../../context/PatientContext';
import CustomSelect from '../shared/CustomSelect';

interface PatientSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  openConfirmationModal: (patientId: string, isNewPatient: boolean) => void;
}


const PatientSelectionModal: React.FC<PatientSelectionModalProps> = ({ isOpen, onClose, openConfirmationModal }) => {
  const { onUpdatePatient, activatePatientContextInSession } = usePatientContext();
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadContextModalOpen, setIsUploadContextModalOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientAge, setNewPatientAge] = useState<number | ''>('');
  const [newPatientSex, setNewPatientSex] = useState<Sex | ''>('');
  const [medicalConditions, setMedicalConditions] = useState<string[]>([]);
  const [medications, setMedications] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [keyPastEvents, setKeyPastEvents] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [manualTextContext, setManualTextContext] = useState('');
  const [useAsCurrentContext, setUseAsCurrentContext] = useState(true);
  const [openPatientOptionsMenuId, setOpenPatientOptionsMenuId] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const uploadContextModalRef = useRef<HTMLDivElement>(null);

  // Utility to generate a unique ID
  const generateUniqueId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const loadPatients = useCallback(() => {
  const patients = getAllPatients();
  setAllPatients(patients);
  }, []);

  const handleCloseUploadContextModal = useCallback(() => {
    setIsUploadContextModalOpen(false);
    setNewPatientName('');
    setNewPatientAge('');
    setNewPatientSex('');
    setMedicalConditions([]);
    setMedications([]);
    setAllergies([]);
    setKeyPastEvents([]);
    setUploadedFiles([]);
    setManualTextContext('');
  }, []);


  useEffect(() => {
    if (isOpen) {
      loadPatients();
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
      if (
        isUploadContextModalOpen &&
        uploadContextModalRef.current &&
        !uploadContextModalRef.current.contains(event.target as Node)
      ) {
        handleCloseUploadContextModal();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isUploadContextModalOpen, onClose, loadPatients, handleCloseUploadContextModal]);


  const sexOptions = [
    { value: '', label: 'Select' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ];

  const handleSelectPatient = (patientId: string) => {
    setActivePatient(patientId);
    const newlyActivePatient = getAllPatients().find(p => p.id === patientId);
    if (newlyActivePatient) {
      onUpdatePatient(newlyActivePatient);
      activatePatientContextInSession(newlyActivePatient.id);
    }
    onClose();
  };

  const handleCreatePatient = () => {
    if (newPatientName && newPatientAge && newPatientSex) {
      const patient = addPatient({
        fullName: newPatientName,
        age: newPatientAge as number,
        sex: newPatientSex as Sex,
        chronicConditions: medicalConditions.filter(c => c).map(c => ({ id: generateUniqueId(), name: c })),
        longTermMedications: medications.filter(m => m).map(m => ({ id: generateUniqueId(), name: m })),
        allergies: allergies.filter(a => a).map(a => ({ id: generateUniqueId(), substance: a })),
        keyPastClinicalEvents: keyPastEvents.filter(e => e).map(e => ({ id: generateUniqueId(), description: e })),
        uploadedFiles: uploadedFiles,
        manualTextContext: manualTextContext,
      });
      onUpdatePatient(patient);
      openConfirmationModal(patient.id, true);
      if (useAsCurrentContext) {
        activatePatientContextInSession(patient.id);
      }
      loadPatients();
      handleCloseUploadContextModal();
      onClose();
    } else {
      alert('Please fill in all patient details.');
    }
  };

  const handleOpenUploadContextModal = () => {
    setIsUploadContextModalOpen(true);
  };

  const handleTogglePatientOptionsMenu = (patientId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering handleSelectPatient
    setOpenPatientOptionsMenuId(openPatientOptionsMenuId === patientId ? null : patientId);
  };

  const handleDeletePatient = (patientId: string) => {
    deletePatient(patientId);
    loadPatients(); // Reload patients after deletion
    setOpenPatientOptionsMenuId(null); // Close the options menu
  };

  const handleFileProcessing = (files: FileList) => {
    const newFiles: UploadedFile[] = Array.from(files).map(file => ({
      id: generateUniqueId(),
      name: file.name,
      type: file.type.split('/')[1] || 'unknown', // e.g., 'pdf', 'jpeg'
      url: URL.createObjectURL(file), // Create a temporary URL for preview
      uploadedAt: new Date().toISOString(),
    }));
    setUploadedFiles(prevFiles => [...prevFiles, ...newFiles]);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcessing(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcessing(e.target.files);
    }
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles(prevFiles => prevFiles.filter(file => file.id !== id));
  };

  const handleAutoFillFromText = () => {
    if (!manualTextContext) {
      alert('Please paste some text into the notes section to auto-fill.');
      return;
    }

    // Basic parsing logic (can be enhanced with more sophisticated AI/NLP)
    const text = manualTextContext.toLowerCase();

    // Extract Name (very basic, assumes "Name: [Full Name]")
    const nameMatch = text.match(/name:\s*([a-z\s]+)/);
    if (nameMatch && nameMatch[1]) {
      setNewPatientName(nameMatch[1].trim().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '));
    }

    // Extract Age
    const ageMatch = text.match(/age:\s*(\d+)/);
    if (ageMatch && ageMatch[1]) {
      setNewPatientAge(parseInt(ageMatch[1]));
    }

    // Extract Sex
    const sexMatch = text.match(/sex:\s*(male|female|other)/);
    if (sexMatch && sexMatch[1]) {
      setNewPatientSex(sexMatch[1] as Sex);
    }

    // Extract Medical Conditions (simple keyword matching)
    const conditionsKeywords = ['diabetes', 'hypertension', 'asthma', 'cancer'];
    const extractedConditions = conditionsKeywords.filter(keyword => text.includes(keyword));
    if (extractedConditions.length > 0) {
      setMedicalConditions(prev => Array.from(new Set([...prev, ...extractedConditions])));
    }

    // Extract Medications (simple keyword matching)
    const medicationKeywords = ['metformin', 'lisinopril', 'albuterol'];
    const extractedMedications = medicationKeywords.filter(keyword => text.includes(keyword));
    if (extractedMedications.length > 0) {
      setMedications(prev => Array.from(new Set([...prev, ...extractedMedications])));
    }

    // Extract Allergies (simple keyword matching)
    const allergyKeywords = ['penicillin', 'latex', 'nuts'];
    const extractedAllergies = allergyKeywords.filter(keyword => text.includes(keyword));
    if (extractedAllergies.length > 0) {
      setAllergies(prev => Array.from(new Set([...prev, ...extractedAllergies])));
    }

    // Extract Key Past Events (simple keyword matching)
    const eventKeywords = ['mi', 'stroke', 'surgery'];
    const extractedEvents = eventKeywords.filter(keyword => text.includes(keyword));
    if (extractedEvents.length > 0) {
      setKeyPastEvents(prev => Array.from(new Set([...prev, ...extractedEvents])));
    }

    alert('Attempted to auto-fill fields from notes. Please review and edit.');
  };

  const filteredPatients = allPatients.filter(patient =>
    patient.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className={`patient-selection-modal-overlay ${isOpen ? 'open' : ''}`}>
      <div className={`patient-selection-modal ${isOpen ? 'open' : ''}`} ref={modalRef}>
        <div className="modal-header">
          <div className="modal-header-content">
            <h2>Create Patient</h2>
            <p className="modal-subtext">Add basic details to create a new patient.</p>
          </div>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-content">
          <input
            type="text"
            placeholder="Search patients..."
            className="patient-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="patient-list-container">
            {filteredPatients.length > 0 ? (
              filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="patient-item"
                  onClick={() => handleSelectPatient(patient.id)}
                >
                  <div className="patient-info">
                    {patient.fullName} · {patient.age}{patient.sex?.charAt(0) || ''}
                  </div>
                  <div className="patient-options">
                    <button
                      className="options-button"
                      onClick={(e) => handleTogglePatientOptionsMenu(patient.id, e)}
                    >
                      &#8226;&#8226;&#8226;
                    </button>
                    {openPatientOptionsMenuId === patient.id && (
                      <div className="options-menu">
                        <button onClick={() => handleDeletePatient(patient.id)}>Delete</button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="patient-item no-patients">No patients found.</div>
            )}
          </div>
          <button className="create-patient-btn" onClick={handleOpenUploadContextModal}>
            + Create New Patient
          </button>

          {isUploadContextModalOpen && (
            <div className="create-patient-form" ref={uploadContextModalRef}>
              <h3>Create New Patient</h3>
              <div className="form-section">
                <h2>BASIC INFO</h2>
                <div className="form-group">
                  <label htmlFor="newPatientName">Name</label>
                  <input
                    id="newPatientName"
                    type="text"
                    placeholder="Full Name"
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="newPatientAge">Age</label>
                  <input
                    id="newPatientAge"
                    type="number"
                    placeholder="Age"
                    value={newPatientAge}
                    onChange={(e) => setNewPatientAge(parseInt(e.target.value) || '')}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="newPatientSex">Sex</label>
                  <CustomSelect
                    options={sexOptions}
                    value={newPatientSex}
                     onChange={(value: string) => setNewPatientSex(value as "" | Sex)}
                    placeholder="Select"
                  />
                </div>
              </div>

              <div className="form-section">
                <h2>PATIENT SNAPSHOT</h2>
                <div className="form-group">
                  <label htmlFor="medicalConditions">Medical Conditions</label>
                  <input
                    id="medicalConditions"
                    type="text"
                    placeholder="e.g. Diabetes, Hypertension"
                    value={medicalConditions.join(', ')}
                    onChange={(e) => setMedicalConditions(e.target.value.split(',').map(s => s.trim()))}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="medications">Medications</label>
                  <input
                    id="medications"
                    type="text"
                    placeholder="e.g. Metformin 500mg"
                    value={medications.join(', ')}
                    onChange={(e) => setMedications(e.target.value.split(',').map(s => s.trim()))}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="allergies">Allergies</label>
                  <input
                    id="allergies"
                    type="text"
                    placeholder="e.g. Penicillin (rash)"
                    value={allergies.join(', ')}
                    onChange={(e) => setAllergies(e.target.value.split(',').map(s => s.trim()))}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="keyPastEvents">Key Past Events</label>
                  <input
                    id="keyPastEvents"
                    type="text"
                    placeholder="e.g. MI in 2021"
                    value={keyPastEvents.join(', ')}
                    onChange={(e) => setKeyPastEvents(e.target.value.split(',').map(s => s.trim()))}
                  />
                </div>
                <p className="helper-text">This improves clinical reasoning accuracy.</p>
              </div>

              <div className="form-section">
                <h2>UPLOAD PATIENT CONTEXT</h2>
                <div
                  className="file-drop-area"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                >
                  <p>Drag & drop files here, or click to select</p>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    accept=".pdf,.jpg,.jpeg,.png,.txt"
                  />
                </div>
                {uploadedFiles.length > 0 && (
                  <div className="uploaded-files-preview">
                    <h4>Uploaded Files:</h4>
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="uploaded-file-item">
                        <span>{file.name} ({file.type})</span>
                        <button onClick={() => handleRemoveFile(file.id)}>&times;</button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="helper-text">Supported formats: PDF, JPG, PNG, TXT</p>
              </div>

              <div className="form-section">
                <h2>PASTE NOTES</h2>
                <textarea
                  id="manualTextContext"
                  placeholder="Paste patient summary, clinical notes, or any relevant text here..."
                  value={manualTextContext}
                  onChange={(e) => setManualTextContext(e.target.value)}
                  rows={6}
                ></textarea>
                <button className="auto-fill-button" onClick={handleAutoFillFromText}>Auto-fill from text</button>
                <p className="helper-text">This text will be used to enrich the patient context.</p>
              </div>

              <div className="form-actions">
                <label className="use-context-checkbox">
                  <input
                    type="checkbox"
                    checked={useAsCurrentContext}
                    onChange={(e) => setUseAsCurrentContext(e.target.checked)}
                  />
                  Use this patient as current context after creation
                </label>
                <button className="primary-button" onClick={handleCreatePatient}>Create</button>
                <button className="secondary-button" onClick={handleCloseUploadContextModal}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientSelectionModal;
