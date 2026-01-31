import React, { useState } from 'react';
import './UploadContextModal.css';

interface UploadContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadFile: (file: File) => void;
  onAddTextContext: (text: string) => void;
}

const UploadContextModal: React.FC<UploadContextModalProps> = ({ isOpen, onClose, onUploadFile, onAddTextContext }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [textContext, setTextContext] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextContext(event.target.value);
  };

  const handleSubmitFile = () => {
    if (selectedFile) {
      onUploadFile(selectedFile);
      setSelectedFile(null);
      onClose();
    }
  };

  const handleSubmitText = () => {
    if (textContext.trim()) {
      onAddTextContext(textContext);
      setTextContext('');
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Upload Patient Context</h2>
        <div className="upload-section">
          <h3>Upload File</h3>
          <input type="file" onChange={handleFileChange} accept=".pdf,.jpg,.png,.txt" />
          <button onClick={handleSubmitFile} disabled={!selectedFile}>Upload File</button>
        </div>
        <div className="add-text-section">
          <h3>Add Text Context</h3>
          <textarea
            placeholder="Enter free-text context here..."
            value={textContext}
            onChange={handleTextChange}
            rows={5}
          ></textarea>
          <button onClick={handleSubmitText} disabled={!textContext.trim()}>Add Text Context</button>
        </div>
        <button onClick={onClose} className="close-button">Close</button>
      </div>
    </div>
  );
};

export default UploadContextModal;
