import { FunctionComponent } from 'react';

interface VisitNotesProps {
  isSidebarOpen: boolean;
  handleToggleSidebar: () => void;
  isAuthenticated: boolean;
  user: any | null;
  onLogout: () => void;
  openPatientSelectionModal: () => void;
  isPatientSelectionModalOpen: boolean;
}

declare const VisitNotes: FunctionComponent<VisitNotesProps>;
export default VisitNotes;
