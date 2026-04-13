import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from '../components/ui/GoogleSignInButton';
import ClarificationChat from '../components/curriculum/ClarificationChat';
import TimeSelection from '../components/curriculum/TimeSelection';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [topicInput, setTopicInput] = useState('');
  const [flowState, setFlowState] = useState('initial'); // initial, analysing, clarifying, timeSelection
  const [clarificationQuestions, setClarificationQuestions] = useState([]);
  const [clarificationOptions, setClarificationOptions] = useState([]);
  const [clarificationAnswers, setClarificationAnswers] = useState([]);

  // Spark cards state
  const [sparkTopics, setSparkTopics] = useState([]);
  const [sparkLoading, setSparkLoading] = useState(true);
  const [sparkError, setSparkError] = useState(false);

  const fetchSparkTopics = useCallback(async () => {
    setSparkLoading(true);
    setSparkError(false);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/topics/spark`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.success && Array.isArray(data.topics) && data.topics.length > 0) {
        setSparkTopics(data.topics);
      } else {
        throw new Error('Empty topics response');
      }
    } catch (err) {
      console.error('[Home] Failed to load spark topics:', err.message);
      setSparkError(true);
      setSparkTopics([
        { topic: 'Machine Learning', promptPhrasing: 'Teach me the basics of Machine Learning' },
        { topic: 'Quantum Computing', promptPhrasing: 'How does Quantum Computing work?' },
        { topic: 'Blockchain', promptPhrasing: 'Break down Blockchain Technology for me' },
        { topic: 'Neuroscience', promptPhrasing: 'Help me understand Neuroscience' },
        { topic: 'Climate Science', promptPhrasing: "Give me a beginner's guide to Climate Science" },
        { topic: 'Cryptography', promptPhrasing: "Explain Cryptography like I'm new to it" },
      ]);
    } finally {
      setSparkLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSparkTopics();
  }, [fetchSparkTopics]);

  const featuredPaths = [
    {
      title: "The Founder Stack",
      description: "Essential skills for building and scaling a startup",
      topics: ["Product-Market Fit", "Fundraising", "Team Building"]
    },
    {
      title: "The AI Literacy Path",
      description: "Understand AI from fundamentals to practical applications",
      topics: ["Machine Learning Basics", "Neural Networks", "AI Ethics"]
    },
    {
      title: "The Investor's Mind",
      description: "Build wealth through smart investing strategies",
      topics: ["Portfolio Theory", "Risk Management", "Market Psychology"]
    }
  ];

  const handleSparkCardClick = (text) => {
    setTopicInput(text);
    // Scroll to prompt bar
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePathClick = (firstTopic) => {
    const prompt = `Teach me ${firstTopic}`;
    setTopicInput(prompt);
    // Scroll to prompt bar
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!topicInput.trim() || !isAuthenticated) return;

    setFlowState('analysing');

    try {
      const response = await api.post('/api/curriculum/analyse', {
        topic: topicInput
      });

      const { clarity, questions, options } = response.data;

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

  const handleClarificationComplete = (answers) => {
    setClarificationAnswers(answers);
    setFlowState('timeSelection');
  };

  const handleTimeSelection = (duration) => {
    navigate('/learn', {
      state: {
        topic: topicInput,
        duration: duration,
        clarificationAnswers: clarificationAnswers
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
      {/* Header */}
      <header className="px-6 py-6 flex justify-between items-center">
        <h1 className="text-3xl font-heading font-bold text-white">Vidya</h1>

        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            <span className="text-primary-100 font-body">Hello, {user?.name?.split(' ')[0]}</span>
            <Link
              to="/dashboard"
              className="px-4 py-2 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-colors"
            >
              Dashboard
            </Link>
            <button
              onClick={logout}
              className="px-4 py-2 text-primary-200 hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <GoogleSignInButton />
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12 space-y-16">
        {/* Conditional Rendering based on flow state */}
        {flowState === 'analysing' && (
          <div className="text-center space-y-4 animate-fade-in">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500"></div>
            <p className="text-xl text-primary-200 font-body">
              Analyzing your request...
            </p>
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

        {flowState === 'initial' && (
          <>
            {/* Hero Section with Prompt Bar */}
            <section className="text-center space-y-8 animate-fade-in">
          <div className="space-y-4">
            <h2 className="text-5xl md:text-6xl font-heading font-bold text-white leading-tight">
              What do you want to<br />learn today?
            </h2>
            <p className="text-xl text-primary-200 font-body max-w-2xl mx-auto">
              AI-powered learning paths tailored to your goals and schedule
            </p>
          </div>

          {/* Prompt Bar */}
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="flex gap-3">
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="What do you want to learn today?"
                className="flex-1 px-6 py-4 rounded-lg bg-white/10 backdrop-blur-sm border-2 border-primary-700 text-white placeholder-primary-300 focus:outline-none focus:border-accent-500 transition-colors font-body text-lg"
              />
              <button
                type="submit"
                className="px-8 py-4 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Start Learning
              </button>
            </div>
          </form>
        </section>

        {/* Spark Cards */}
        <section className="space-y-6">
          <h3 className="text-2xl font-heading font-semibold text-white text-center">
            Or try one of these...
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sparkLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="p-6 bg-white/5 backdrop-blur-sm border border-primary-700 rounded-lg" style={{
                    height: '80px',
                    animation: 'pulse 1.4s infinite'
                  }} />
                ))
              : sparkTopics.map((t, i) => (
                  <button
                    key={`${t.topic}-${i}`}
                    onClick={() => handleSparkCardClick(t.promptPhrasing)}
                    className="p-6 bg-white/5 backdrop-blur-sm border border-primary-700 rounded-lg hover:bg-white/10 hover:border-accent-500 transition-all duration-200 text-left group"
                  >
                    <p className="text-primary-100 group-hover:text-white transition-colors font-body">
                      {t.promptPhrasing}
                    </p>
                  </button>
                ))
            }
          </div>
        </section>

        {/* Featured Learning Paths */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h3 className="text-3xl font-heading font-bold text-white">
              Featured Learning Paths
            </h3>
            <p className="text-primary-200 font-body">
              Curated journeys to master connected skills
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredPaths.map((path, index) => (
              <div
                key={index}
                onClick={() => handlePathClick(path.topics[0])}
                className="p-8 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-primary-700 rounded-xl hover:border-accent-500 hover:shadow-xl transition-all duration-200 space-y-4 group cursor-pointer"
              >
                <h4 className="text-2xl font-heading font-bold text-white group-hover:text-accent-400 transition-colors">
                  {path.title}
                </h4>
                <p className="text-primary-200 font-body">
                  {path.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {path.topics.map((topic, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-primary-800/50 text-primary-100 text-sm rounded-full font-body"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

            {/* Footer CTA */}
            {!isAuthenticated && (
              <section className="text-center py-12 space-y-6">
                <h3 className="text-3xl font-heading font-bold text-white">
                  Ready to start your learning journey?
                </h3>
                <GoogleSignInButton />
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default Home;
