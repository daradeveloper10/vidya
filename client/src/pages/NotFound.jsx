import { useNavigate } from 'react-router-dom';

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex items-center justify-center px-6">
      <div className="text-center space-y-8">
        <h1 className="text-9xl font-heading font-bold text-white">404</h1>
        <p className="text-2xl text-primary-200 font-body">This page doesn't exist</p>
        <button
          onClick={() => navigate('/')}
          className="px-8 py-4 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-all duration-200 shadow-lg hover:shadow-xl font-body text-lg"
        >
          ← Go Home
        </button>
      </div>
    </div>
  );
}

export default NotFound;
