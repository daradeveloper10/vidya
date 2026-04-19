import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

function AppHeader() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [searchTopic, setSearchTopic] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTopic.trim()) return;
    navigate('/start', { state: { topic: searchTopic.trim() } });
    setSearchTopic('');
  };

  if (!isAuthenticated) return null;

  return (
    <header className="px-4 py-3 flex items-center gap-3">
      <h1
        className="text-2xl font-heading font-bold text-white cursor-pointer flex-shrink-0"
        onClick={() => navigate('/')}
      >
        Vidya
      </h1>

      <form onSubmit={handleSearch} className="flex-1 max-w-xl">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchTopic}
            onChange={(e) => setSearchTopic(e.target.value)}
            placeholder="Learn something new..."
            className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-primary-700 text-white placeholder-primary-400 focus:outline-none focus:border-accent-500 transition-colors font-body text-sm"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-colors text-sm flex-shrink-0"
          >
            Go
          </button>
        </div>
      </form>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          to="/dashboard"
          className="px-3 py-2 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors text-sm"
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