import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import AppHeader from '../components/ui/AppHeader';
import api from '../services/api';

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [curricula, setCurricula] = useState([]);
  const [loading, setLoading] = useState(true);

  const SkeletonCard = () => (
    <div className="bg-white/5 backdrop-blur-sm border border-primary-700 rounded-xl p-6 space-y-4 animate-pulse">
      <div className="h-6 bg-white/10 rounded w-3/4"></div>
      <div className="h-4 bg-white/10 rounded w-1/2"></div>
      <div className="h-2 bg-white/10 rounded w-full"></div>
      <div className="flex gap-2">
        <div className="h-8 bg-white/10 rounded w-24"></div>
        <div className="h-8 bg-white/10 rounded w-24"></div>
      </div>
    </div>
  );

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCurricula();
  }, []);

  const fetchCurricula = async () => {
    try {
      console.log('Fetching curricula...');
      const response = await api.get('/api/curriculum/user/all');
      console.log('Curricula response:', response.data);
      setCurricula(response.data);
    } catch (error) {
      console.error('Error fetching curricula:', error);
      console.error('Error details:', error.response?.data);
      if (error.response?.status === 401) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (curriculumId, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this curriculum?')) return;
    try {
      await api.delete(`/api/curriculum/${curriculumId}`);
      setCurricula(curricula.filter(c => c._id !== curriculumId));
    } catch (error) {
      console.error('Error deleting curriculum:', error);
      alert('Failed to delete curriculum. Please try again.');
    }
  };

  const calculateProgress = (curriculum) => {
    if (!curriculum.modules || curriculum.modules.length === 0) return 0;
    const completedModules = curriculum.modules.filter(m => m.completed).length;
    return Math.round((completedModules / curriculum.modules.length) * 100);
  };

  const getDisplayTitle = (curriculum) => curriculum.displayTitle || curriculum.topic;
  const getSubtitle = (curriculum) => curriculum.subtitle || curriculum.duration;

  const getInProgressCurriculum = () => {
    return curricula.find(c => !c.completed && c.currentModuleIndex < c.modules.length);
  };

  const getActiveCurricula = () => curricula.filter(c => !c.completed);
  const getCompletedCurricula = () => curricula.filter(c => c.completed);

  const filteredActiveCurricula = getActiveCurricula().filter(c =>
    getDisplayTitle(c).toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCompletedCurricula = getCompletedCurricula().filter(c =>
    getDisplayTitle(c).toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const inProgressCurriculum = getInProgressCurriculum();

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

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now - d);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
        <AppHeader />
        <main className="max-w-7xl mx-auto px-6 py-12 space-y-16">
          <section className="space-y-6">
            <div className="h-10 bg-white/10 rounded w-64 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-16">
        {/* ZONE 1: Return Zone */}
        <section className="space-y-6">
          <h1 className="text-4xl font-heading font-bold text-white">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>

          {inProgressCurriculum ? (
            <div className="bg-gradient-to-br from-accent-500/20 to-accent-600/10 backdrop-blur-sm border-2 border-accent-500/50 rounded-xl p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-accent-300 font-body text-sm uppercase tracking-wide">Continue Learning</p>
                  <h2 className="text-3xl font-heading font-bold text-white">
                    {getDisplayTitle(inProgressCurriculum)}
                  </h2>
                  <p className="text-primary-200 font-body">
                    {getSubtitle(inProgressCurriculum)}
                  </p>
                  <p className="text-primary-300 font-body text-sm">
                    Module {inProgressCurriculum.currentModuleIndex + 1} of {inProgressCurriculum.modules.length} • {calculateProgress(inProgressCurriculum)}% complete
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/module/${inProgressCurriculum._id}/${inProgressCurriculum.currentModuleIndex}`)}
                  className="px-8 py-4 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-all duration-200 shadow-lg hover:shadow-xl font-body text-lg"
                >
                  Continue →
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-sm border border-primary-700 rounded-xl p-8 text-center">
              <h2 className="text-2xl font-heading font-bold text-white mb-4">
                Ready to learn something new?
              </h2>
              <Link to="/" className="inline-block px-8 py-4 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-all duration-200 shadow-lg hover:shadow-xl font-body">
                Start Learning
              </Link>
            </div>
          )}
        </section>

        {/* ZONE 2: Your Learning */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-heading font-bold text-white">Your Learning</h2>
            <input
              type="text"
              placeholder="Search your curricula..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-primary-700 rounded-lg text-white placeholder-primary-300 focus:outline-none focus:border-accent-500 transition-colors font-body"
            />
          </div>

          {/* Active Curricula */}
          {filteredActiveCurricula.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-heading font-semibold text-primary-200">In Progress</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredActiveCurricula.map((curriculum) => {
                  const progress = calculateProgress(curriculum);
                  return (
                    <div
                      key={curriculum._id}
                      className="bg-white/5 backdrop-blur-sm border border-primary-700 rounded-xl p-6 hover:border-accent-500 transition-all duration-200 space-y-4 group cursor-pointer"
                      onClick={() => navigate(`/module/${curriculum._id}/${curriculum.currentModuleIndex || 0}`)}
                    >
                      <div className="space-y-1">
                        <h4 className="text-xl font-heading font-bold text-white group-hover:text-accent-400 transition-colors">
                          {getDisplayTitle(curriculum)}
                        </h4>
                        <p className="text-accent-300 font-body text-sm italic">
                          {getSubtitle(curriculum)}
                        </p>
                        <p className="text-primary-300 font-body text-sm">
                          {curriculum.modules.length} modules
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm font-body">
                          <span className="text-primary-300">Progress</span>
                          <span className="text-accent-400 font-semibold">{progress}%</span>
                        </div>
                        <div className="w-full bg-primary-800 rounded-full h-2">
                          <div
                            className="bg-accent-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <p className="text-primary-400 font-body text-sm">
                        Last accessed {formatDate(curriculum.updatedAt)}
                      </p>

                      <div className="flex gap-2">
                        <button className="flex-1 px-4 py-2 bg-accent-500/20 text-accent-400 font-semibold rounded-lg hover:bg-accent-500 hover:text-white transition-all duration-200 font-body">
                          Continue
                        </button>
                        <button
                          onClick={(e) => handleDelete(curriculum._id, e)}
                          className="px-4 py-2 bg-red-500/20 text-red-400 font-semibold rounded-lg hover:bg-red-500 hover:text-white transition-all duration-200 font-body"
                          title="Delete curriculum"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completed Curricula */}
          {filteredCompletedCurricula.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-heading font-semibold text-primary-200">Completed</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCompletedCurricula.map((curriculum) => (
                  <div
                    key={curriculum._id}
                    className="bg-white/5 backdrop-blur-sm border border-primary-700 rounded-xl p-6 hover:border-accent-500 transition-all duration-200 space-y-4 group cursor-pointer"
                    onClick={() => navigate(`/complete/${curriculum._id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <h4 className="text-xl font-heading font-bold text-white group-hover:text-accent-400 transition-colors">
                          {getDisplayTitle(curriculum)}
                        </h4>
                        <p className="text-accent-300 font-body text-sm italic">
                          {getSubtitle(curriculum)}
                        </p>
                        <p className="text-primary-300 font-body text-sm">
                          {curriculum.modules.length} modules
                        </p>
                      </div>
                      <div className="text-4xl">🏆</div>
                    </div>

                    <p className="text-primary-400 font-body text-sm">
                      Completed {formatDate(curriculum.updatedAt)}
                    </p>

                    <div className="flex gap-2">
                      <button className="flex-1 px-4 py-2 bg-primary-700/50 text-primary-200 font-semibold rounded-lg hover:bg-primary-700 hover:text-white transition-all duration-200 font-body">
                        Review
                      </button>
                      <button
                        onClick={(e) => handleDelete(curriculum._id, e)}
                        className="px-4 py-2 bg-red-500/20 text-red-400 font-semibold rounded-lg hover:bg-red-500 hover:text-white transition-all duration-200 font-body"
                        title="Delete curriculum"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredActiveCurricula.length === 0 && filteredCompletedCurricula.length === 0 && (
            <div className="text-center py-12">
              <p className="text-primary-300 font-body text-lg">
                {searchQuery ? 'No curricula found matching your search.' : 'No curricula yet. Start learning something new!'}
              </p>
            </div>
          )}
        </section>

        {/* ZONE 3: Discover */}
        <section className="space-y-6">
          <h2 className="text-3xl font-heading font-bold text-white">Continue Your Journey</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredPaths.map((path, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-primary-700 rounded-xl p-8 hover:border-accent-500 transition-all duration-200 space-y-4 group"
              >
                <h4 className="text-2xl font-heading font-bold text-white group-hover:text-accent-400 transition-colors">
                  {path.title}
                </h4>
                <p className="text-primary-200 font-body">{path.description}</p>
                <div className="flex flex-wrap gap-2">
                  {path.topics.map((topic, idx) => (
                    <span key={idx} className="px-3 py-1 bg-primary-800/50 text-primary-100 text-sm rounded-full font-body">
                      {topic}
                    </span>
                  ))}
                </div>
                <Link
                  to="/"
                  className="block w-full px-4 py-2 bg-accent-500/20 text-accent-400 font-semibold rounded-lg hover:bg-accent-500 hover:text-white transition-all duration-200 text-center font-body"
                >
                  Start Path
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;