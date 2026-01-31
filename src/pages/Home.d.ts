import { FunctionComponent } from 'react';

interface HomeProps {
  onTogglePatientSidebar?: () => void;
}

declare const Home: FunctionComponent<HomeProps>;
export default Home;
