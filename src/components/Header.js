import './Header.css';
import { useNavigate } from 'react-router-dom';



const Header = ({ logoSrc }) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <img
          src={logoSrc}
          alt="Dohrnii Logo"
          className="header-logo"
          onClick={handleGoHome}
          style={{ cursor: 'pointer' }}
        />
      </div>
      <nav className="auth-buttons">
        <button onClick={() => navigate('/login')} className="login-btn">Login</button>
        <button onClick={() => navigate('/signup')} className="signup-btn">Signup</button>
      </nav>
    </header>
  );
};

export default Header;