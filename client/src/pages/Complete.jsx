import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AppHeader from '../components/ui/AppHeader';
import api from '../services/api';
import confetti from 'canvas-confetti';

function Complete() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [curriculum, setCurriculum] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    modulesCompleted: 0,
    averageScore: 0,
    totalMinutes: 0
  });

  useEffect(() => {
    fetchCurriculumAndComplete();
    triggerConfetti();
  }, [id]);

  const triggerConfetti = () => {
    // Initial burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Additional bursts
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
    }, 250);

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
    }, 400);
  };

  const fetchCurriculumAndComplete = async () => {
    try {
      // Fetch curriculum
      const response = await api.get(`/api/curriculum/${id}`);
      const curriculumData = response.data;
      setCurriculum(curriculumData);

      // Get user's total learning time
      const userResponse = await api.get('/api/auth/me');
      const totalMinutes = userResponse.data.user.totalLearningTime || 0;

      // Calculate stats from curriculum
      const modulesCompleted = curriculumData.modules.filter(m => m.completed).length;
      const scores = curriculumData.modules
        .filter(m => m.score !== undefined && m.score !== null)
        .map(m => m.score);
      const averageScore = scores.length > 0 
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

      setStats({
        modulesCompleted,
        averageScore,
        totalMinutes
      });

      // Mark as complete
      await api.patch(`/api/curriculum/${id}/complete`);

      // Fetch recommendations
      const recsResponse = await api.post(`/api/curriculum/${id}/furtherlearning`);
      setRecommendations(recsResponse.data.recommendations);

    } catch (error) {
      console.error('Error fetching curriculum:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getSubjectIcon = (topic) => {
    const topicLower = topic.toLowerCase();
    if (topicLower.includes('code') || topicLower.includes('programming') || topicLower.includes('javascript') || topicLower.includes('python')) {
      return '💻';
    } else if (topicLower.includes('design') || topicLower.includes('art')) {
      return '🎨';
    } else if (topicLower.includes('business') || topicLower.includes('marketing')) {
      return '📊';
    } else if (topicLower.includes('science') || topicLower.includes('physics') || topicLower.includes('chemistry')) {
      return '🔬';
    } else if (topicLower.includes('language') || topicLower.includes('writing')) {
      return '📚';
    } else if (topicLower.includes('music')) {
      return '🎵';
    } else if (topicLower.includes('math')) {
      return '🔢';
    } else if (topicLower.includes('ai') || topicLower.includes('machine learning')) {
      return '🤖';
    }
    return '🎓';
  };

  const handleStartLearning = (prefilledPrompt) => {
    // Navigate to home with prefilled prompt
    navigate('/', { state: { prefilledPrompt } });
  };

  if (loading || !curriculum) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
        <div className="text-white text-xl font-body">Loading...</div>
      </div>
    );
  }

  const subjectIcon = getSubjectIcon(curriculum.topic);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
      <AppHeader />

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-16">
        {/* Celebration Section */}
        <section className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-6xl font-heading font-bold text-white animate-fade-in">
              You did it! 🎉
            </h1>
            <h2 className="text-4xl font-heading font-bold text-accent-400">
              {curriculum.displayTitle || curriculum.topic}
            </h2>
          </div>

          {/* Passport Stamp */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="text-9xl animate-bounce-slow">
                {subjectIcon}
              </div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-accent-500 text-white px-4 py-1 rounded-full text-sm font-semibold font-body">
                New Stamp!
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm border border-primary-700 rounded-xl p-6">
              <div className="text-4xl font-bold text-accent-400 font-heading">
                {stats.modulesCompleted}
              </div>
              <div className="text-primary-200 font-body mt-2">
                Modules Completed
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-primary-700 rounded-xl p-6">
              <div className="text-4xl font-bold text-accent-400 font-heading">
                {stats.averageScore}%
              </div>
              <div className="text-primary-200 font-body mt-2">
                Average Quiz Score
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-primary-700 rounded-xl p-6">
              <div className="text-4xl font-bold text-accent-400 font-heading">
                {stats.totalMinutes}
              </div>
              <div className="text-primary-200 font-body mt-2">
                Minutes of Learning
              </div>
            </div>
          </div>

          <p className="text-xl text-primary-200 font-body max-w-2xl mx-auto">
            You've mastered {curriculum.topic}. This knowledge is now part of your learning journey. 
            Keep building on what you've learned!
          </p>
        </section>

        {/* Further Learning Section */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-heading font-bold text-white">
              Continue Your Journey
            </h2>
            <p className="text-primary-300 font-body">
              Based on what you just learned, here's what you might explore next
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm border border-primary-700 rounded-xl p-6 hover:border-accent-500 transition-all duration-200 space-y-4 group"
              >
                <h3 className="text-xl font-heading font-bold text-white group-hover:text-accent-400 transition-colors">
                  {rec.topic}
                </h3>
                <p className="text-primary-200 font-body">
                  {rec.reason}
                </p>
                <button
                  onClick={() => handleStartLearning(rec.prefilledPrompt)}
                  className="w-full px-4 py-2 bg-accent-500/20 text-accent-400 font-semibold rounded-lg hover:bg-accent-500 hover:text-white transition-all duration-200 font-body"
                >
                  Start Learning →
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="space-y-6 text-center">
          <div className="space-y-4">
            <h3 className="text-2xl font-heading font-bold text-white">
              What do you want to learn next?
            </h3>
            <Link
              to="/"
              className="inline-block px-8 py-4 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-all duration-200 shadow-lg hover:shadow-xl font-body text-lg"
            >
              Explore New Topics
            </Link>
          </div>

          <Link
            to="/dashboard"
            className="inline-block text-primary-300 hover:text-white transition-colors font-body"
          >
            ← Back to Dashboard
          </Link>
        </section>
      </main>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default Complete;
