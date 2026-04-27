import { useAuth } from '../context/AuthContext';
import ClarificationChat from '../components/curriculum/ClarificationChat';
import TimeSelection from '../components/curriculum/TimeSelection';
import SignInModal from '../components/ui/SignInModal';
import AppHeader from '../components/ui/AppHeader';
import GoogleSignInButton from '../components/ui/GoogleSignInButton';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../services/api';

function Start() {
  function toTitleCase(str) {
    if (!str) return '';
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [topicInput, setTopicInput] = useState('');
  const [flowState, setFlowState] = useState('initial');
  const [clarificationQuestions, setClarificationQuestions] = useState([]);
  const [clarificationOptions, setClarificationOptions] = useState([]);
  const [clarificationAnswers, setClarificationAnswers] = useState([]);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [topicType, setTopicType] = useState('skill');
  const [confirmationData, setConfirmationData] = useState(null);

  // Wait for auth to resolve then auto-start if topic is pre-filled
  useEffect(() => {
    if (loading) return;
    const topic = location.state?.topic || new URLSearchParams(location.search).get('topic') || '';

    if (!topic) return;
    setTopicInput(topic);

    if (isAuthenticated) {
      startLearningFlow(topic);
    }
    // If not authenticated, topic is pre-filled in input — user submits manually
  }, [loading]);

  // Handle navigation to /start while already on /start (e.g. header search)
  useEffect(() => {
    const topic = location.state?.topic || new URLSearchParams(location.search).get('topic') || '';
    if (!topic || loading) return;
    setTopicInput(topic);
    setFlowState('initial');
    setClarificationAnswers([]);
    if (isAuthenticated) {
      startLearningFlow(topic);
    }
  }, [location]);

  // After login, resume pending topic
  useEffect(() => {
    if (isAuthenticated) {
      const pendingTopic = localStorage.getItem('pendingTopic');
      if (pendingTopic) {
        localStorage.removeItem('pendingTopic');
        setShowSignInModal(false);
        setTopicInput(pendingTopic);
        startLearningFlow(pendingTopic);
      }
    }
  }, [isAuthenticated]);

  const requireAuth = (topic) => {
    if (!isAuthenticated) {
      localStorage.setItem('pendingTopic', topic);
      setShowSignInModal(true);
      return false;
    }
    return true;
  };

  const startLearningFlow = async (topic) => {
    setFlowState('analysing');
    try {
      const response = await api.post('/api/curriculum/analyse', { topic });
      const { clarity, topicType: type, questions, options } = response.data;
      setTopicType(type || 'skill');
      if (clarity === 'clear') {
        setFlowState('timeSelection');
      } else {
        setClarificationQuestions(questions);
        setClarificationOptions(options || []);
        setFlowState('clarifying');
      }
    } catch (error) {
      setFlowState('initial');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topicInput.trim()) return;
    if (!requireAuth(topicInput)) return;
    await startLearningFlow(topicInput);
  };

  const handleClarificationComplete = async (answers, questions) => {
    setClarificationAnswers(answers);
    try {
      setFlowState('analysing');
      const response = await api.post('/api/curriculum/validate-answers', {
        topic: topicInput,
        questions,
        clarificationAnswers: answers,
      });
      if (response.data.sufficient) {
        setFlowState('timeSelection');
      } else {
        setClarificationQuestions([response.data.followUpQuestion]);
        setClarificationOptions([]);
        setFlowState('clarifying');
      }
    } catch (err) {
      setFlowState('timeSelection');
    }
  };

  const handleTimeSelection = (duration) => {
    setConfirmationData({
      topic: topicInput,
      duration,
      clarificationAnswers,
      topicType,
    });
    setFlowState('confirmation');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
        <div className="text-white text-xl font-body">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {flowState === 'initial' && (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl sm:text-5xl font-heading font-bold text-white">
                What do you want to learn?
              </h1>
              <p className="text-primary-200 font-body text-lg">
                Type a topic and we'll build a personalised learning path for you.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  placeholder="e.g. Negotiation, Quantum Computing, Personal Finance..."
                  autoFocus
                  className="flex-1 px-6 py-4 rounded-lg bg-white/10 backdrop-blur-sm border-2 border-primary-700 text-white placeholder-primary-300 focus:outline-none focus:border-accent-500 transition-colors font-body text-lg"
                />
                <button
                  type="submit"
                  className="px-8 py-4 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-all duration-200 shadow-lg font-body"
                >
                  Go
                </button>
              </div>
            </form>

            {!isAuthenticated && (
              <div className="text-center space-y-4 pt-4">
                <p className="text-primary-300 font-body">Sign in to start learning</p>
                <GoogleSignInButton />
              </div>
            )}
          </div>
        )}

        {flowState === 'analysing' && (
          <div className="text-center space-y-4 animate-fade-in py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500"></div>
            <p className="text-xl text-primary-200 font-body">Analysing your request...</p>
          </div>
        )}

        {flowState === 'clarifying' && (
          <ClarificationChat
            questions={clarificationQuestions}
            options={clarificationOptions}
            onComplete={handleClarificationComplete}
          />
        )}

        {flowState === 'timeSelection' && (
          <TimeSelection onSelect={handleTimeSelection} />
        )}

        {flowState === 'confirmation' && confirmationData && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-heading font-bold text-white">Ready to start?</h2>
              <p className="text-primary-300 font-body">Here's what you're about to learn</p>
            </div>

            <div className="bg-white/5 border border-primary-700 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-primary-400 font-body text-sm uppercase tracking-wide">Topic</p>
                  <p className="text-white font-heading font-bold text-2xl">{toTitleCase(confirmationData.topic)}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-primary-400 font-body text-sm uppercase tracking-wide">Duration</p>
                  <p className="text-accent-400 font-heading font-bold text-2xl">{confirmationData.duration}</p>
                </div>
              </div>
              {confirmationData.clarificationAnswers?.length > 0 && (
                <div className="pt-3 border-t border-primary-700">
                  <p className="text-primary-400 font-body text-sm">
                    {confirmationData.clarificationAnswers.join(' · ')}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  navigate('/learn', {
                    state: {
                      topic: confirmationData.topic,
                      duration: confirmationData.duration,
                      clarificationAnswers: confirmationData.clarificationAnswers,
                      topicType: confirmationData.topicType,
                    }
                  });
                }}
                className="w-full px-8 py-4 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-all duration-200 shadow-lg font-body text-lg"
              >
                Start Learning →
              </button>

              <button
                onClick={() => setFlowState('timeSelection')}
                className="w-full px-8 py-4 bg-white/5 border border-primary-700 text-primary-200 font-body rounded-lg hover:bg-white/10 transition-colors"
              >
                ← Change duration
              </button>

              <button
                onClick={() => {
                  setTopicInput('');
                  setClarificationAnswers([]);
                  setConfirmationData(null);
                  setFlowState('initial');
                }}
                className="w-full px-4 py-2 text-primary-400 hover:text-white transition-colors font-body text-sm text-center"
              >
                ← Start over with a different topic
              </button>
            </div>
          </div>
        )}

      </main>

      {showSignInModal && <SignInModal onClose={() => setShowSignInModal(false)} />}
    </div>
  );
}

export default Start;