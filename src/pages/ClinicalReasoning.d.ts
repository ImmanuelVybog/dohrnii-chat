import { FunctionComponent } from 'react';

interface ClinicalReasoningProps {
  isSidebarOpen: boolean;
  handleToggleSidebar: () => void;
  isAuthenticated: boolean;
  user: any | null;
  onLogout: () => void;
  openPatientSelectionModal: () => void;
  isPatientSelectionModalOpen: boolean;
}

declare const ClinicalReasoning: FunctionComponent<ClinicalReasoningProps>;
export default ClinicalReasoning;
