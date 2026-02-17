import React, { useState, useEffect, useRef, useCallback } from 'react';
import './PatientSelectionModal.css';
import { setActivePatient, addPatient, deletePatient } from '../../services/patientService';
import { Patient, Sex, UploadedFile } from '../../types/patient';
import { usePatientContext } from '../../context/PatientContext';
import CustomSelect from '../shared/CustomSelect';
import TagInput from '../shared/TagInput';

interface PatientSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  openConfirmationModal: (patientId: string, isNewPatient: boolean) => void;
}


const PatientSelectionModal: React.FC<PatientSelectionModalProps> = ({ isOpen, onClose, openConfirmationModal }) => {
  const { allPatients, refreshPatients, onUpdatePatient, activatePatientContextInSession, activePatientId, deactivatePatientContextInSession } = usePatientContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'upload'>('manual');
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
  const [errors, setErrors] = useState<{ name?: string; age?: string; sex?: string }>({});

  const modalRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Utility to generate a unique ID
  const generateUniqueId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const handleCloseAddPatient = useCallback(() => {
    setIsAddPatientOpen(false);
    setActiveTab('manual');
    setNewPatientName('');
    setNewPatientAge('');
    setNewPatientSex('');
    setMedicalConditions([]);
    setMedications([]);
    setAllergies([]);
    setKeyPastEvents([]);
    setUploadedFiles([]);
    setManualTextContext('');
    setErrors({});
  }, []);

  useEffect(() => {
    if (isOpen) {
      refreshPatients();
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, refreshPatients]);


  const sexOptions = [
    { value: '', label: 'Select' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ];

  const handleSelectPatient = (patientId: string) => {
    setActivePatient(patientId);
    const newlyActivePatient = allPatients.find((p: Patient) => p.id === patientId);
    if (newlyActivePatient) {
      onUpdatePatient(newlyActivePatient);
      activatePatientContextInSession(newlyActivePatient.id);
    }
    onClose();
  };

  const handleCreatePatient = () => {
    const newErrors: { name?: string; age?: string; sex?: string } = {};
    if (!newPatientName.trim()) newErrors.name = 'Name is required';
    if (!newPatientAge) newErrors.age = 'Age is required';
    if (!newPatientSex) newErrors.sex = 'Sex is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

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
    refreshPatients();
    handleCloseAddPatient();
    onClose();
  };

  const handleTogglePatientOptionsMenu = (patientId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering handleSelectPatient
    setOpenPatientOptionsMenuId(openPatientOptionsMenuId === patientId ? null : patientId);
  };

  const handleDeletePatient = (patientId: string) => {
    deletePatient(patientId);
    if (activePatientId === patientId) {
      onUpdatePatient(null);
      deactivatePatientContextInSession();
    }
    refreshPatients(); // Reload patients after deletion
    setOpenPatientOptionsMenuId(null); // Close the options menu
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const index = Math.max(0, Math.min(i, sizes.length - 1));
    return parseFloat((bytes / Math.pow(k, index)).toFixed(2)) + ' ' + sizes[index];
  };

  const handleFileProcessing = (files: FileList) => {
    const newFiles: UploadedFile[] = Array.from(files).map(file => ({
      id: generateUniqueId(),
      name: file.name,
      type: file.type.split('/')[1] || 'unknown', // e.g., 'pdf', 'jpeg'
      size: file.size, // Size in bytes
      url: URL.createObjectURL(file), // Create a temporary URL for preview
      uploadedAt: new Date().toISOString(),
    }));
    setUploadedFiles(prevFiles => [...prevFiles, ...newFiles]);

    // Auto-fill name from first file if name is empty
    if (!newPatientName && files.length > 0) {
      const fileName = files[0].name;
      const name = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
      setNewPatientName(name);
    }
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

  const handleAddTag = useCallback((tag: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prevTags => {
      if (tag && !prevTags.includes(tag)) {
        return [...prevTags, tag];
      }
      return prevTags;
    });
  }, []);

  const handleRemoveTag = useCallback((tag: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prevTags => prevTags.filter(t => t !== tag));
  }, []);

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

  const filteredPatients = allPatients.filter((patient: Patient) =>
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
        {isAddPatientOpen && (
          <div className="patient-creation-tabs">
            <button 
              className={`tab-button ${activeTab === 'manual' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('manual');
                setTimeout(() => {
                  if (modalContentRef.current) modalContentRef.current.scrollTop = 0;
                }, 0);
              }}
            >
              Manual Creation
            </button>
            <button 
              className={`tab-button ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('upload');
                setTimeout(() => {
                  if (modalContentRef.current) modalContentRef.current.scrollTop = 0;
                }, 0);
              }}
            >
              Upload Context
            </button>
          </div>
        )}
        <div className="modal-content" ref={modalContentRef}>
          {!isAddPatientOpen ? (
            <>
              <input
                type="text"
                placeholder="Search patients..."
                aria-label="Search patients"
                className="patient-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="patient-list-container">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((patient: Patient) => (
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
              <div className="patient-selection-actions">
                <button className="create-patient-btn" onClick={() => setIsAddPatientOpen(true)}>
                  + Create Patient
                </button>
              </div>
            </>
          ) : (
            <div className="create-patient-form">
              {activeTab === 'manual' && (
                <>
                </>
              )}

              {activeTab === 'upload' && (
                <>
                  <div className="form-section">
                    <h2>UPLOAD PATIENT CONTEXT</h2>
                    <div
                      className="file-drop-area"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleFileDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="upload-icon-circle">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16af9f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="17 8 12 3 7 8"></polyline>
                          <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                      </div>
                      <h4 className="upload-title">Drag and drop patient files</h4>
                      <p className="upload-subtitle">or click to browse your device</p>
                      
                      <div className="upload-buttons">
                        <button 
                          type="button"
                          className="choose-files-btn" 
                          onClick={(e) => { 
                            e.preventDefault();
                            e.stopPropagation(); 
                            fileInputRef.current?.click(); 
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                          </svg>
                          Upload Files
                        </button>
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        accept=".pdf,.jpg,.jpeg,.png,.txt"
                        style={{ display: 'none' }}
                      />
                      <p className="upload-helper-text">PDF, TXT, JPG, PNG • Max 10MB per file • Only upload files relevant to this patient.</p>
                    </div>
                    {uploadedFiles.length > 0 && (
                      <div className="uploaded-files-preview">
                        <h4>Uploaded Files:</h4>
                        {uploadedFiles.map((file) => (
                          <div key={file.id} className="uploaded-file-item">
                            <div className="file-icon">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                              </svg>
                            </div>
                            <div className="file-info">
                              <span className="file-name">{file.name}</span>
                              <span className="file-size">{formatFileSize(file.size)}</span>
                            </div>
                            <button className="remove-file-btn" onClick={() => handleRemoveFile(file.id)} title="Remove file">
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                  </div>

                  <div className="divider">
                    <span>or</span>
                  </div>

                  <div className="form-section">
                    <h2 id="paste-notes-header">PASTE NOTES</h2>
                    <textarea
                      id="manualTextContext"
                      aria-labelledby="paste-notes-header"
                      placeholder="Paste patient summary, clinical notes, or any relevant text here..."
                      value={manualTextContext}
                      onChange={(e) => setManualTextContext(e.target.value)}
                      rows={6}
                    ></textarea>
                    <button className="auto-fill-button" onClick={handleAutoFillFromText}>Auto-fill from text</button>
                  </div>
                </>
              )}

              <div className="form-section">
                <h2>BASIC INFO</h2>
                <div className="form-group">
                  <label htmlFor="newPatientName">Name</label>
                  <input
                    id="newPatientName"
                    type="text"
                    placeholder="Full Name"
                    value={newPatientName}
                    onChange={(e) => {
                      setNewPatientName(e.target.value);
                      if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
                    }}
                    className={errors.name ? 'input-error' : ''}
                  />
                  {errors.name && <span className="error-message">{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="newPatientAge">Age</label>
                  <input
                    id="newPatientAge"
                    type="number"
                    placeholder="Age"
                    value={newPatientAge}
                    onChange={(e) => {
                      setNewPatientAge(parseInt(e.target.value) || '');
                      if (errors.age) setErrors(prev => ({ ...prev, age: undefined }));
                    }}
                    className={errors.age ? 'input-error' : ''}
                  />
                  {errors.age && <span className="error-message">{errors.age}</span>}
                </div>
                <div className="form-group">
                  <span id="sex-label" className="input-label">Sex</span>
                  <CustomSelect
                    aria-labelledby="sex-label"
                    options={sexOptions}
                    value={newPatientSex}
                     onChange={(value: string) => {
                       setNewPatientSex(value as "" | Sex);
                       if (errors.sex) setErrors(prev => ({ ...prev, sex: undefined }));
                     }}
                    placeholder="Select"
                    className={errors.sex ? 'input-error' : ''}
                  />
                  {errors.sex && <span className="error-message">{errors.sex}</span>}
                </div>
              </div>

              <div className="form-section">
                <h2>PATIENT SNAPSHOT</h2>
                  <TagInput
                    id="newPatientConditions"
                    label="Medical Conditions"
                    placeholder="e.g. Diabetes, Hypertension (Type and press enter)"
                    tags={medicalConditions}
                    onAddTag={(tag) => handleAddTag(tag, setMedicalConditions)}
                    onRemoveTag={(tag) => handleRemoveTag(tag, setMedicalConditions)}
                  />
                  <TagInput
                    id="newPatientMedications"
                    label="Medications"
                    placeholder="e.g. Metformin 500mg (Type and press enter)"
                    tags={medications}
                    onAddTag={(tag) => handleAddTag(tag, setMedications)}
                    onRemoveTag={(tag) => handleRemoveTag(tag, setMedications)}
                  />
                  <TagInput
                    id="newPatientAllergies"
                    label="Allergies"
                    placeholder="e.g. Penicillin (rash) (Type and press enter)"
                    tags={allergies}
                    onAddTag={(tag) => handleAddTag(tag, setAllergies)}
                    onRemoveTag={(tag) => handleRemoveTag(tag, setAllergies)}
                  />
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
                <button className="secondary-button" onClick={handleCloseAddPatient}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientSelectionModal;
