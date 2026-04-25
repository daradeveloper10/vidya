import { useAuth } from '../context/AuthContext';
import ClarificationChat from '../components/curriculum/ClarificationChat';
import TimeSelection from '../components/curriculum/TimeSelection';
import PathBuilder from '../components/curriculum/PathBuilder';
import SignInModal from '../components/ui/SignInModal';
import AppHeader from '../components/ui/AppHeader';
import GoogleSignInButton from '../components/ui/GoogleSignInButton';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../services/api';

function Start() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [topicInput, setTopicInput] = useState('');
  const [flowState, setFlowState] = useState('initial');
  const [clarificationQuestions, setClarificationQuestions] = useState([]);
  const [clarificationOptions, setClarificationOptions] = useState([]);
  const [clarificationAnswers, setClarificationAnswers] = useState([]);
  const [pathBuilderData, setPathBuilderData] = useState(null);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [topicType, setTopicType] = useState('skill');

  // Wait for auth to resolve then auto-start if topic is pre-filled
  useEffect(() => {
    if (loading) return;
    const topic = location.state?.topic || new URLSearchParams(location.search).get('topic') || '';
    const skipToPathBuilder = location.state?.skipToPathBuilder || false;
    const duration = location.state?.duration || '2hrs';
    const clarificationAnswers = location.state?.clarificationAnswers || [];

    if (!topic) return;
    setTopicInput(topic);

    if (isAuthenticated && skipToPathBuilder) {
      setClarificationAnswers(clarificationAnswers);
      setPathBuilderData({ topic, duration, clarificationAnswers, topicType: 'skill' });
      setFlowState('pathBuilding');
    } else if (isAuthenticated) {
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
    setPathBuilderData(null);
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

  const DURATIONS_REQUIRING_PATH = ['2hrs', '5hrs', '10hrs'];

  const handleTimeSelection = (duration) => {
    const shouldOfferPath = DURATIONS_REQUIRING_PATH.includes(duration) && topicType !== 'concept';
    if (shouldOfferPath) {
      setPathBuilderData({ topic: topicInput, duration, clarificationAnswers, topicType });
      setFlowState('pathBuilding');
    } else {
      navigate('/learn', {
        state: { topic: topicInput, duration, clarificationAnswers }
      });
    }
  };

  const handlePathConfirm = (pathData) => {
    navigate('/learn', {
      state: {
        topic: topicInput,
        duration: pathBuilderData.duration,
        clarificationAnswers,
        pathData,
      }
    });
  };

  const handlePathSkip = () => {
    navigate('/learn', {
      state: {
        topic: topicInput,
        duration: pathBuilderData.duration,
        clarificationAnswers,
      }
    });
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

        {flowState === 'pathBuilding' && pathBuilderData && (
          <PathBuilder
            topic={pathBuilderData.topic}
            duration={pathBuilderData.duration}
            clarificationAnswers={clarificationAnswers}
            topicType={pathBuilderData.topicType}
            onConfirm={handlePathConfirm}
            onSkip={handlePathSkip}
          />
        )}

      </main>

      {showSignInModal && <SignInModal onClose={() => setShowSignInModal(false)} />}
    </div>
  );
}

export default Start;