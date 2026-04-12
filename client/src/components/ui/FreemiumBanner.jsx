import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

function FreemiumBanner() {
  const { user } = useAuth();
  const [remaining, setRemaining] = useState(30);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await api.get('/api/auth/me');
      const freeMinutesUsed = response.data.user.freeMinutesUsed || 0;
      setRemaining(Math.max(0, 30 - freeMinutesUsed));
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Don't show for active subscribers
  if (user?.subscriptionStatus === 'active') {
    return null;
  }

  // Don't show for non-free users
  if (user?.subscriptionStatus !== 'free') {
    return null;
  }

  const getBannerStyle = () => {
    if (remaining <= 0) {
      return 'bg-red-600 text-white';
    } else if (remaining < 8) {
      return 'bg-gradient-to-r from-red-500 to-orange-500 text-white';
    } else if (remaining <= 15) {
      return 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white';
    } else {
      return 'bg-primary-800/50 text-primary-200';
    }
  };

  const getMessage = () => {
    if (remaining <= 0) {
      return "You've used your free learning time — Subscribe to continue";
    } else if (remaining < 8) {
      return `⏱ ${remaining} min left — unlock unlimited learning`;
    } else if (remaining <= 15) {
      return `⏱ ${remaining} min of free learning left`;
    } else {
      return `⏱ ${remaining} min of free learning remaining`;
    }
  };

  return (
    <div className={`${getBannerStyle()} px-6 py-3 text-center font-body text-sm transition-all duration-300`}>
      <div className="flex items-center justify-center gap-4">
        <span>{getMessage()}</span>
        <span className="text-primary-300">|</span>
        <Link 
          to="/upgrade" 
          className="font-semibold hover:underline"
        >
          {remaining <= 0 ? 'Subscribe →' : 'Upgrade →'}
        </Link>
      </div>
    </div>
  );
}

export default FreemiumBanner;
