import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from '../components/ui/GoogleSignInButton';

function SignIn() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      const pendingTopic = localStorage.getItem('pendingTopic');
      if (pendingTopic) {
        navigate('/');
      } else {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 px-6">
      <div className="text-center space-y-8 max-w-md w-full">
        <h1 className="text-4xl font-heading font-bold text-white">Vidya</h1>
        <div className="space-y-3">
          <h2 className="text-2xl font-heading font-semibold text-white">
            Sign in to start learning
          </h2>
          <p className="text-primary-200 font-body">
            Your personalised learning path is one click away.
          </p>
        </div>
        <GoogleSignInButton />
        <button
          onClick={() => navigate('/')}
          className="text-primary-300 hover:text-white transition-colors font-body text-sm"
        >
          ← Back to home
        </button>
      </div>
    </div>
  );
}

export default SignIn;
