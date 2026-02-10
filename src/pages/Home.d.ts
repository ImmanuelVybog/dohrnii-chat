import { FunctionComponent } from 'react';

interface HomeProps {
  isSidebarOpen: boolean;
  handleToggleSidebar: () => void;
  isAuthenticated: boolean;
  user: any | null;
  onLogout: () => void;
  openPatientSelectionModal: () => void;
  isPatientSelectionModalOpen: boolean;
}

declare const Home: FunctionComponent<HomeProps>;
export default Home;
