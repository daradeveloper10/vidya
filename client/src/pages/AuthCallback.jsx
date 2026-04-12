import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      console.log('AuthCallback loaded, URL:', window.location.href);
      const params = new URLSearchParams(window.location.search);
      const error = params.get('error');

      if (error) {
        navigate('/login?error=auth_failed');
        return;
      }

      // Token arrived — session cookie was set by backend
      // Just refresh auth state and go to dashboard
      try {
        await checkAuth();
        navigate('/dashboard');
      } catch {
        navigate('/login?error=auth_failed');
      }
    };

    handleCallback();
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      gap: '16px'
    }}>
      <div style={{ fontSize: '2rem' }}>⏳</div>
      <p style={{ fontSize: '1.1rem', color: '#666' }}>Signing you in...</p>
    </div>
  );
};

export default AuthCallback;