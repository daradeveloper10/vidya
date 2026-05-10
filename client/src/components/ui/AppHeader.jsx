import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

function AppHeader() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [searchTopic, setSearchTopic] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTopic.trim()) return;
    navigate('/start', { state: { topic: searchTopic.trim() } });
    setSearchTopic('');
    setShowSearch(false);
  };

  if (!isAuthenticated) return null;

  return (
    <header className="px-4 py-3 border-b border-primary-800/50">

      {/* Main row */}
      <div className="flex items-center gap-2">
        <h1
          className="text-xl sm:text-2xl font-heading font-bold text-white cursor-pointer flex-shrink-0"
          onClick={() => navigate('/')}
        >
          Vidya
        </h1>

        {/* Search bar — hidden on mobile, visible on sm+ */}
        <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-xl">
          <div className="flex gap-2 w-full">
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

        <div className="flex items-center gap-2 ml-auto flex-shrink-0">
          {/* Search icon — mobile only */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="sm:hidden p-2 text-primary-300 hover:text-white transition-colors"
            aria-label="Search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          <Link
            to="/dashboard"
            className="px-3 py-1.5 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors text-sm"
          >
            Dashboard
          </Link>
          <button
            onClick={handleLogout}
            className="hidden sm:block px-3 py-1.5 text-primary-200 hover:text-white transition-colors text-sm whitespace-nowrap"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Mobile search — expands below when search icon clicked */}
      {showSearch && (
        <form onSubmit={handleSearch} className="sm:hidden mt-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchTopic}
              onChange={(e) => setSearchTopic(e.target.value)}
              placeholder="Learn something new..."
              autoFocus
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
      )}
    </header>
  );
}

export default AppHeader;