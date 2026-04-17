import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function AppHeader() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!isAuthenticated) return null;

  return (
    <header className="px-4 py-4 flex justify-between items-center">
      <h1
        className="text-2xl font-heading font-bold text-white cursor-pointer flex-shrink-0"
        onClick={() => navigate('/')}
      >
        Vidya
      </h1>
      <div className="flex items-center gap-2 sm:gap-4">
        <span className="hidden sm:block text-primary-100 font-body text-sm">
          Hello, {user?.name?.split(' ')[0]}
        </span>
        <Link
          to="/dashboard"
          className="px-3 py-2 sm:px-4 sm:py-2 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-colors text-sm"
        >
          Dashboard
        </Link>
        <button
          onClick={handleLogout}
          className="px-3 py-2 text-primary-200 hover:text-white transition-colors text-sm whitespace-nowrap"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}

export default AppHeader;
