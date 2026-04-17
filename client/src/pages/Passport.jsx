import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppHeader from '../components/ui/AppHeader';
import api from '../services/api';

function Passport() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [curricula, setCurricula] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStamp, setSelectedStamp] = useState(null);

  useEffect(() => {
    fetchCurricula();
  }, []);

  const fetchCurricula = async () => {
    try {
      const response = await api.get('/api/curriculum/user/all');
      
      // Deduplicate by topic - keep most recently updated
      const uniqueCurricula = response.data.reduce((acc, curr) => {
        const existing = acc.find(c => c.topic.toLowerCase() === curr.topic.toLowerCase());
        if (!existing) {
          acc.push(curr);
        } else {
          // Replace if current is more recent
          const existingDate = new Date(existing.updatedAt);
          const currentDate = new Date(curr.updatedAt);
          if (currentDate > existingDate) {
            const index = acc.indexOf(existing);
            acc[index] = curr;
          }
        }
        return acc;
      }, []);
      
      setCurricula(uniqueCurricula);
    } catch (error) {
      console.error('Error fetching curricula:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryFromTopic = (topic) => {
    const topicLower = topic.toLowerCase();
    
    // Finance
    if (topicLower.includes('finance') || topicLower.includes('invest') || topicLower.includes('money') || 
        topicLower.includes('compound') || topicLower.includes('interest') || topicLower.includes('stock') || 
        topicLower.includes('crypto') || topicLower.includes('wealth') || topicLower.includes('budget') ||
        topicLower.includes('saving') || topicLower.includes('tax') || topicLower.includes('accounting') ||
        topicLower.includes('economics')) {
      return { emoji: '💰', color: 'amber', name: 'Finance' };
    }
    // Psychology
    else if (topicLower.includes('psychology') || topicLower.includes('behaviour') || topicLower.includes('behavior') ||
             topicLower.includes('mind') || topicLower.includes('mental') || topicLower.includes('emotion') || 
             topicLower.includes('cognitive') || topicLower.includes('habit') || topicLower.includes('motivation')) {
      return { emoji: '🧠', color: 'purple', name: 'Psychology' };
    }
    // Technology
    else if (topicLower.includes('tech') || topicLower.includes('code') || topicLower.includes('coding') || 
             topicLower.includes('programming') || topicLower.includes('javascript') || topicLower.includes('python') || 
             topicLower.includes('ai') || topicLower.includes('machine learning') || topicLower.includes('software')) {
      return { emoji: '💻', color: 'blue', name: 'Technology' };
    }
    // Business
    else if (topicLower.includes('business') || topicLower.includes('entrepreneur') || topicLower.includes('startup') || 
             topicLower.includes('marketing') || topicLower.includes('sales') || topicLower.includes('strategy') ||
             topicLower.includes('negotiation') || topicLower.includes('leadership') || topicLower.includes('management') ||
             topicLower.includes('productivity') || topicLower.includes('communication') || topicLower.includes('persuasion') ||
             topicLower.includes('influence')) {
      return { emoji: '📈', color: 'green', name: 'Business' };
    }
    // Culture/History
    else if (topicLower.includes('history') || topicLower.includes('geography') || topicLower.includes('culture') || 
             topicLower.includes('politics') || topicLower.includes('world')) {
      return { emoji: '🌍', color: 'teal', name: 'Culture' };
    }
    // Creativity
    else if (topicLower.includes('design') || topicLower.includes('art') || topicLower.includes('creative') || 
             topicLower.includes('music') || topicLower.includes('writing')) {
      return { emoji: '🎨', color: 'pink', name: 'Creativity' };
    }
    // Science
    else if (topicLower.includes('science') || topicLower.includes('physics') || topicLower.includes('chemistry') || 
             topicLower.includes('biology') || topicLower.includes('research')) {
      return { emoji: '🔬', color: 'cyan', name: 'Science' };
    }
    // Law
    else if (topicLower.includes('law') || topicLower.includes('legal') || topicLower.includes('ethics') || 
             topicLower.includes('rights') || topicLower.includes('justice')) {
      return { emoji: '⚖️', color: 'orange', name: 'Law' };
    }
    // General
    else {
      return { emoji: '📚', color: 'grey', name: 'General' };
    }
  };

  const getCompletionPercentage = (curriculum) => {
    if (!curriculum.modules || curriculum.modules.length === 0) return 0;
    const completedModules = curriculum.modules.filter(m => m.completed).length;
    return Math.round((completedModules / curriculum.modules.length) * 100);
  };

  const getStampStyle = (percentage) => {
    if (percentage < 50) {
      return 'opacity-30 grayscale border-2 border-primary-600';
    } else if (percentage < 100) {
      return 'opacity-70 border-2 border-primary-500';
    } else {
      return 'opacity-100 border-4 border-amber-500 shadow-lg shadow-amber-500/50';
    }
  };

  const getColorClass = (color, percentage) => {
    const baseColors = {
      amber: percentage >= 100 ? 'bg-amber-500 text-amber-900' : percentage >= 50 ? 'bg-amber-500/70 text-amber-100' : 'bg-primary-800 text-primary-400',
      purple: percentage >= 100 ? 'bg-purple-500 text-purple-900' : percentage >= 50 ? 'bg-purple-500/70 text-purple-100' : 'bg-primary-800 text-primary-400',
      blue: percentage >= 100 ? 'bg-blue-500 text-blue-900' : percentage >= 50 ? 'bg-blue-500/70 text-blue-100' : 'bg-primary-800 text-primary-400',
      green: percentage >= 100 ? 'bg-green-500 text-green-900' : percentage >= 50 ? 'bg-green-500/70 text-green-100' : 'bg-primary-800 text-primary-400',
      teal: percentage >= 100 ? 'bg-teal-500 text-teal-900' : percentage >= 50 ? 'bg-teal-500/70 text-teal-100' : 'bg-primary-800 text-primary-400',
      pink: percentage >= 100 ? 'bg-pink-500 text-pink-900' : percentage >= 50 ? 'bg-pink-500/70 text-pink-100' : 'bg-primary-800 text-primary-400',
      cyan: percentage >= 100 ? 'bg-cyan-500 text-cyan-900' : percentage >= 50 ? 'bg-cyan-500/70 text-cyan-100' : 'bg-primary-800 text-primary-400',
      orange: percentage >= 100 ? 'bg-orange-500 text-orange-900' : percentage >= 50 ? 'bg-orange-500/70 text-orange-100' : 'bg-primary-800 text-primary-400',
      grey: percentage >= 100 ? 'bg-gray-500 text-gray-900' : percentage >= 50 ? 'bg-gray-500/70 text-gray-100' : 'bg-primary-800 text-primary-400',
    };
    return baseColors[color] || baseColors.grey;
  };

  const calculateStats = () => {
    const completed = curricula.filter(c => c.completed).length;
    const inProgress = curricula.filter(c => !c.completed && c.currentModuleIndex > 0).length;
    
    const scores = curricula
      .filter(c => c.modules && c.modules.some(m => m.score !== undefined))
      .flatMap(c => c.modules.filter(m => m.score !== undefined).map(m => m.score));
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    const categories = curricula.map(c => getCategoryFromTopic(c.topic).name);
    const categoryCount = categories.reduce((acc, cat) => {
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});
    const favourite = Object.keys(categoryCount).length > 0 
      ? Object.keys(categoryCount).reduce((a, b) => categoryCount[a] > categoryCount[b] ? a : b)
      : 'None yet';

    return {
      totalStamps: curricula.length,
      inProgress,
      completed,
      avgScore,
      favourite
    };
  };

  const formatDate = (date) => {
    if (!date) return 'In progress';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
        <div className="text-white text-xl font-body">Loading your passport...</div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-heading font-bold text-white">Knowledge Passport</h1>
          <p className="text-xl text-primary-200 font-body">
            {user?.name?.split(' ')[0]}'s Learning Journey
          </p>
        </div>

        {curricula.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 space-y-6">
            <div className="text-9xl">🌱</div>
            <h2 className="text-3xl font-heading font-bold text-white">Your passport is empty</h2>
            <p className="text-xl text-primary-200 font-body max-w-md mx-auto">
              Start learning something new to earn your first stamp!
            </p>
            <Link
              to="/"
              className="inline-block px-8 py-4 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-all duration-200 shadow-lg hover:shadow-xl font-body text-lg"
            >
              Start Learning
            </Link>
          </div>
        ) : (
          <>
            {/* Stats Panel */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white/5 backdrop-blur-sm border border-primary-700 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-accent-400 font-heading">{stats.totalStamps}</div>
                <div className="text-primary-200 font-body text-sm mt-1">Total Stamps</div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm border border-primary-700 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-accent-400 font-heading">{stats.inProgress}</div>
                <div className="text-primary-200 font-body text-sm mt-1">In Progress</div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm border border-primary-700 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-accent-400 font-heading">{stats.completed}</div>
                <div className="text-primary-200 font-body text-sm mt-1">Completed</div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm border border-primary-700 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-accent-400 font-heading">{stats.avgScore}%</div>
                <div className="text-primary-200 font-body text-sm mt-1">Avg Quiz Score</div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm border border-primary-700 rounded-xl p-6 text-center">
                <div className="text-2xl font-bold text-accent-400 font-heading">{stats.favourite}</div>
                <div className="text-primary-200 font-body text-sm mt-1">Favourite Subject</div>
              </div>
            </div>

            {/* Stamp Grid */}
            <div className="space-y-4">
              <h2 className="text-2xl font-heading font-bold text-white">Your Stamps</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {curricula.map((curriculum, index) => {
                  const category = getCategoryFromTopic(curriculum.topic);
                  const percentage = getCompletionPercentage(curriculum);
                  const stampStyle = getStampStyle(percentage);
                  const colorClass = getColorClass(category.color, percentage);

                  return (
                    <div
                      key={curriculum._id}
                      onClick={() => setSelectedStamp(curriculum)}
                      className={`${stampStyle} ${colorClass} rounded-xl p-6 cursor-pointer hover:scale-105 transition-all duration-300 animate-fade-in`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="text-center space-y-3">
                        <div className="text-6xl">{category.emoji}</div>
                        <div className="font-heading font-bold text-sm line-clamp-2">
                          {curriculum.displayTitle || curriculum.topic}
                        </div>
                        <div className="text-xs opacity-75 font-body">
                          {percentage}% Complete
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Stamp Detail Modal */}
      {selectedStamp && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50"
          onClick={() => setSelectedStamp(null)}
        >
          <div 
            className="bg-gradient-to-br from-primary-900 to-primary-800 border-2 border-primary-700 rounded-2xl p-8 max-w-md w-full space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="text-6xl">{getCategoryFromTopic(selectedStamp.topic).emoji}</div>
                <div>
                  <h3 className="text-2xl font-heading font-bold text-white">{selectedStamp.topic}</h3>
                  <p className="text-primary-300 font-body text-sm">{getCategoryFromTopic(selectedStamp.topic).name}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStamp(null)}
                className="text-primary-400 hover:text-white transition-colors text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-primary-200 font-body">
              <div className="flex justify-between">
                <span>Duration:</span>
                <span className="text-white font-semibold">{selectedStamp.duration}</span>
              </div>
              <div className="flex justify-between">
                <span>Modules:</span>
                <span className="text-white font-semibold">
                  {selectedStamp.modules.filter(m => m.completed).length} / {selectedStamp.modules.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Completion:</span>
                <span className="text-white font-semibold">{getCompletionPercentage(selectedStamp)}%</span>
              </div>
              {selectedStamp.completed && (
                <div className="flex justify-between">
                  <span>Completed:</span>
                  <span className="text-white font-semibold">{formatDate(selectedStamp.updatedAt)}</span>
                </div>
              )}
              {selectedStamp.modules.some(m => m.score !== undefined) && (
                <div className="flex justify-between">
                  <span>Quiz Score:</span>
                  <span className="text-white font-semibold">
                    {Math.round(
                      selectedStamp.modules
                        .filter(m => m.score !== undefined)
                        .reduce((sum, m) => sum + m.score, 0) /
                      selectedStamp.modules.filter(m => m.score !== undefined).length
                    )}%
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate(`/module/${selectedStamp._id}/0`)}
              className="w-full px-6 py-3 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-all duration-200 font-body"
            >
              Revisit →
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}

export default Passport;
