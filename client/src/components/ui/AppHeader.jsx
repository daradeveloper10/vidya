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
    <header className="px-6 py-6 flex justify-between items-center">
      <h1
        className="text-3xl font-heading font-bold text-white cursor-pointer"
        onClick={() => navigate('/')}
      >
        Vidya
      </h1>
      <div className="flex items-center gap-4">
        <span className="text-primary-100 font-body">Hello, {user?.name?.split(' ')[0]}</span>
        <Link
          to="/dashboard"
          className="px-4 py-2 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-colors"
        >
          Dashboard
        </Link>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-primary-200 hover:text-white transition-colors"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}

export default AppHeader;
