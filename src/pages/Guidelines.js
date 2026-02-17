import React, { useState, useEffect } from 'react';
import { usePatientContext } from '../context/PatientContext';
import PrimaryActionButton from '../components/shared/PrimaryActionButton';
import ResultCard from '../components/shared/ResultCard';
import EmptyState from '../components/shared/EmptyState';
import CustomSelect from '../components/shared/CustomSelect';
import './Guidelines.css';
import referencesIconLight from '../assets/images/references-icon-light.svg';
import referencesIconDark from '../assets/images/references-icon-dark.svg';
import { useTheme } from '../context/ThemeContext';
import { apiClient } from '../services/apiClient';

const mockGuidelines = [
  {
    id: '1',
    title: 'AHA/ACC Guideline for the Management of Patients With Valvular Heart Disease',
    source: 'American Heart Association / American College of Cardiology',
    year: 2020,
    summary: 'Comprehensive recommendations for the diagnosis and management of valvular heart disease.',
    link: 'https://www.ahajournals.org/doi/10.1161/CIR.0000000000000923',
  },
  {
    id: '2',
    title: 'NICE Guideline: Diabetes in adults: management',
    source: 'National Institute for Health and Care Excellence',
    year: 2019,
    summary: 'Evidence-based recommendations for the management of type 1 and type 2 diabetes in adults.',
    link: 'https://www.nice.org.uk/guidance/ng28',
  },
  {
    id: '3',
    title: 'ATS/IDSA Clinical Practice Guidelines: Management of Community-Acquired Pneumonia',
    source: 'American Thoracic Society / Infectious Diseases Society of America',
    year: 2019,
    summary: 'Guidelines for the diagnosis and treatment of community-acquired pneumonia in adults.',
    link: 'https://www.atsjournals.org/doi/full/10.1164/rccm.201908-1523ST',
  },
  {
    id: '4',
    title: 'WHO Guidelines for the pharmacological treatment of hypertension in adults',
    source: 'World Health Organization',
    year: 2021,
    summary: 'Recommendations on the use of medicines to treat hypertension in adults.',
    link: 'https://www.who.int/publications/i/item/9789240033986',
  },
];

const specialtyOptions = [
  { value: '', label: 'All Specialties' },
  { value: 'heart', label: 'Cardiology' },
  { value: 'diabetes', label: 'Endocrinology' },
  { value: 'infectious', label: 'Infectious Diseases' },
  { value: 'who', label: 'Public Health (WHO)' },
  // Add more specialties as needed
];

/**
 * @param {object} props
 * @param {boolean} props.isSidebarOpen
 * @param {function} props.handleToggleSidebar
 * @param {boolean} props.isAuthenticated
 * @param {object | null} props.user
 * @param {function} props.onLogout
 * @param {function} props.openPatientSelectionModal
 * @param {boolean} props.isPatientSelectionModalOpen
 */
const Guidelines = ({ isSidebarOpen, handleToggleSidebar, isAuthenticated, user, onLogout, openPatientSelectionModal, isPatientSelectionModalOpen }) => {
  const { selectedPatient } = usePatientContext();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [references, setReferences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);
  const [aiResponse, setAiResponse] = useState('');

  useEffect(() => {
    if (selectedPatient) {
      console.log('Selected Patient for Guidelines:', {
        fullName: selectedPatient.fullName,
        age: selectedPatient.age,
        sex: selectedPatient.sex,
        chronicConditions: selectedPatient.chronicConditions,
      });
    }
  }, [selectedPatient]);

  const handleSearchGuidelines = async () => {
    if (!searchQuery.trim()) {
      alert('Please enter a search query.');
      return;
    }

    setLoading(true);
    setSearched(true);
    setError(null);
    setSearchResults([]);

    try {
      const data = await apiClient.searchGuidelines(searchQuery);
      if (data.ok) {
        setSearchResults(data.structured?.results || []);
        setAiResponse(data.content);
        setReferences(data.references || []);
      } else {
        setError(data.content || 'An unexpected error occurred.');
      }
    } catch (err) {
      console.error('Error searching guidelines:', err);
      setError('System encountered an issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="workspaces-container">
      <div className="page-header">
        <h1>Clinical Guidelines Explorer</h1>
        <p>Search for and explore clinical guidelines based on keywords and specialties</p>
      </div>

      <div className="form-container">
        <div className="form-section">
          <h2>Search for Guidelines</h2>
          <div className="form-group">
            <label htmlFor="searchQuery">Keywords</label>
            <input
              type="text"
              id="searchQuery"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g., hypertension, diabetes management"
            />
          </div>
          <div className="form-group">
            <label htmlFor="specialty">Specialty/Source (Optional)</label>
            <CustomSelect
              options={specialtyOptions}
              value={selectedSpecialty}
              onChange={setSelectedSpecialty}
              placeholder="Select a specialty"
            />
          </div>
          <PrimaryActionButton
            label={loading ? 'Searching...' : 'Search Guidelines'}
            onClick={handleSearchGuidelines}
            disabled={loading}
          />
          </div>
      </div>

      {error && (
        <div className="error-message-container">
          <p className="error-message">{error}</p>
          <button className="retry-button" onClick={handleSearchGuidelines}>Retry</button>
        </div>
      )}

      <div className="search-results-section">
        <h2>Search Results</h2>
        {loading && <p>Searching for guidelines...</p>}
        {!loading && searched && searchResults.length === 0 && !aiResponse && (
          <EmptyState message="No guidelines found matching your criteria." />
        )}
        {!loading && !searched && (
          <EmptyState message="Enter keywords and/or select a specialty to find guidelines." />
        )}

        {!loading && aiResponse && (
          <div className="ai-response-markdown">
            <ResultCard 
              title="Clinical Guidelines Summary"
              content={<div className="markdown-content" dangerouslySetInnerHTML={{ __html: aiResponse }} />}
            />
          </div>
        )}

        {!loading && searchResults.length > 0 && (
          <div className="guideline-list">
            {searchResults.map((guideline) => (
              <ResultCard
                key={guideline.id}
                title={guideline.title}
                content={
                  <>
                    <p><strong>Source:</strong> {guideline.source}</p>
                    <p><strong>Year:</strong> {guideline.pubdate || guideline.year}</p>
                    <p>
                      <a href={guideline.url || guideline.link} target="_blank" rel="noopener noreferrer">
                        View Full Guideline
                      </a>
                    </p>
                  </>
                }
              />
            ))}
          </div>
        )}

        {references && references.length > 0 && (
          <div className="citations-section" style={{ marginTop: '2rem' }}>
            <h4 className="citations-title">
              <img src={theme === 'light' ? referencesIconLight : referencesIconDark} alt="References" />
              References
            </h4>
            <div className="citations-list">
              {references.map((citation) => (
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
      </div>
    </div>
  );
};

export default Guidelines;