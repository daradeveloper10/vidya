import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

function Paywall({ nextModuleTitle, onClose }) {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('annual');

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      await api.patch('/api/user/subscribe', { plan: selectedPlan });
      await refreshUser();
      if (onClose) onClose();
    } catch (error) {
      console.error('Error subscribing:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <div className="bg-gradient-to-br from-primary-900 to-primary-800 border-2 border-primary-700 rounded-2xl p-8 max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h2 className="text-4xl font-heading font-bold text-white">
            You're making real progress 🎉
          </h2>
          <p className="text-xl text-primary-200 font-body">
            Unlock the full journey to keep going
          </p>
          {nextModuleTitle && (
            <p className="text-primary-300 font-body text-sm">
              Next up: <span className="text-accent-400 font-semibold">{nextModuleTitle}</span>
            </p>
          )}
        </div>

        {/* Subscription Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Monthly Plan */}
          <div
            onClick={() => setSelectedPlan('monthly')}
            className={`${
              selectedPlan === 'monthly'
                ? 'border-accent-500 bg-accent-500/10'
                : 'border-primary-600 bg-white/5'
            } border-2 rounded-xl p-6 cursor-pointer hover:border-accent-500 transition-all duration-200 space-y-4`}
          >
            <div className="space-y-2">
              <h3 className="text-2xl font-heading font-bold text-white">Monthly</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-accent-400 font-heading">$9.99</span>
                <span className="text-primary-300 font-body">/month</span>
              </div>
            </div>
            <ul className="space-y-2 text-primary-200 font-body text-sm">
              <li>✓ Unlimited learning time</li>
              <li>✓ All topics & modules</li>
              <li>✓ Cancel anytime</li>
            </ul>
          </div>

          {/* Annual Plan */}
          <div
            onClick={() => setSelectedPlan('annual')}
            className={`${
              selectedPlan === 'annual'
                ? 'border-accent-500 bg-accent-500/10'
                : 'border-primary-600 bg-white/5'
            } border-2 rounded-xl p-6 cursor-pointer hover:border-accent-500 transition-all duration-200 space-y-4 relative`}
          >
            <div className="absolute -top-3 right-4 bg-accent-500 text-white px-3 py-1 rounded-full text-xs font-semibold font-body">
              Save 33%
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-heading font-bold text-white">Annual</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-accent-400 font-heading">$79.99</span>
                <span className="text-primary-300 font-body">/year</span>
              </div>
              <p className="text-primary-400 font-body text-xs">Just $6.67/month</p>
            </div>
            <ul className="space-y-2 text-primary-200 font-body text-sm">
              <li>✓ Unlimited learning time</li>
              <li>✓ All topics & modules</li>
              <li>✓ Best value</li>
            </ul>
          </div>
        </div>

        {/* Subscribe Button */}
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full px-8 py-4 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-all duration-200 shadow-lg hover:shadow-xl font-body text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Subscribe to Continue'}
        </button>

        {/* Maybe Later Link */}
        <div className="text-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-primary-400 hover:text-white transition-colors font-body text-sm"
          >
            Maybe later → Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default Paywall;
