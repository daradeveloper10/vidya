import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/ui/AppHeader';
import api from '../services/api';

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [curricula, setCurricula] = useState([]);
  const [userPaths, setUserPaths] = useState([]);
  const [userGeneratedPaths, setUserGeneratedPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [curriculaRes, userPathsRes, userGeneratedPathsRes] = await Promise.all([
        api.get('/api/curriculum/user/all'),
        api.get('/api/paths/enrolled'),
        api.get('/api/user-paths'),
      ]);
      setCurricula(curriculaRes.data);
      setUserPaths(userPathsRes.data);
      setUserGeneratedPaths(userGeneratedPathsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (error.response?.status === 401) navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCurriculum = async (curriculumId, e) => {
    e.stopPropagation();
    if (!confirm('Delete this curriculum?')) return;
    try {
      await api.delete(`/api/curriculum/${curriculumId}`);
      setCurricula(curricula.filter(c => c._id !== curriculumId));
    } catch (error) {
      console.error('Error deleting curriculum:', error);
    }
  };

  const handleDeletePath = async (pathId, e) => {
    e.stopPropagation();
    if (!confirm('Delete this learning path?')) return;
    try {
      await api.delete(`/api/user-paths/${pathId}`);
      setUserGeneratedPaths(userGeneratedPaths.filter(p => p._id !== pathId));
    } catch (error) {
      console.error('Error deleting path:', error);
    }
  };

  const calculateProgress = (curriculum) => {
    if (!curriculum.modules || curriculum.modules.length === 0) return 0;
    const completed = curriculum.modules.filter(m => m.completed).length;
    return Math.round((completed / curriculum.modules.length) * 100);
  };

  const getDisplayTitle = (curriculum) => curriculum.displayTitle || curriculum.topic;
  const getSubtitle = (curriculum) => curriculum.subtitle || curriculum.duration;

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor(Math.abs(now - d) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Build unified active learning list sorted by most recently updated
  const buildActiveItems = () => {
    const items = [];

    // Add active standalone curricula (not part of a path, not completed)
    curricula
      .filter(c => !c.completed)
      .forEach(c => items.push({
        type: 'curriculum',
        id: c._id,
        title: getDisplayTitle(c),
        subtitle: getSubtitle(c),
        progress: calculateProgress(c),
        updatedAt: c.updatedAt,
        data: c,
      }));

    // Add user generated paths (in progress)
    userGeneratedPaths
      .filter(p => p.status !== 'completed')
      .forEach(p => {
        const completedCount = p.curricula.filter(c => c.completed).length;
        const progressPercent = p.curricula.length > 0
          ? Math.round((completedCount / p.curricula.length) * 100)
          : 0;
        items.push({
          type: 'userPath',
          id: p._id,
          title: p.name,
          subtitle: `${p.curricula.length} curricula · ${p.totalDuration || ''}`,
          progress: progressPercent,
          updatedAt: p.updatedAt,
          data: p,
        });
      });

    // Add enrolled static paths (in progress)
    userPaths
      .filter(up => !up.completed)
      .forEach(up => {
        const path = up.pathId;
        const completedCount = up.completedCourses?.length || 0;
        const totalCourses = path?.courses?.length || 0;
        const progressPercent = totalCourses > 0
          ? Math.round((completedCount / totalCourses) * 100)
          : 0;
        items.push({
          type: 'staticPath',
          id: up._id,
          title: path?.title || 'Learning Path',
          subtitle: `${totalCourses} courses`,
          progress: progressPercent,
          updatedAt: up.updatedAt || up.createdAt || new Date().toISOString(),
          data: up,
          pathSlug: path?.slug,
        });
      });

    return items.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  };

  // Build unified completed list
  const buildCompletedItems = () => {
    const items = [];

    curricula
      .filter(c => c.completed)
      .forEach(c => items.push({
        type: 'curriculum',
        id: c._id,
        title: getDisplayTitle(c),
        subtitle: getSubtitle(c),
        updatedAt: c.updatedAt,
        data: c,
      }));

    userGeneratedPaths
      .filter(p => p.status === 'completed')
      .forEach(p => items.push({
        type: 'userPath',
        id: p._id,
        title: p.name,
        subtitle: `${p.curricula.length} curricula`,
        updatedAt: p.updatedAt,
        data: p,
      }));

    userPaths
      .filter(up => up.completed)
      .forEach(up => {
        const path = up.pathId;
        items.push({
          type: 'staticPath',
          id: up._id,
          title: path?.title || 'Learning Path',
          subtitle: `${path?.courses?.length || 0} courses`,
          updatedAt: up.updatedAt,
          data: up,
          pathSlug: path?.slug,
        });
      });

    return items.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  };

  const handleItemClick = (item) => {
    if (item.type === 'curriculum') {
      navigate(`/module/${item.data._id}/${item.data.currentModuleIndex || 0}`);
    } else if (item.type === 'userPath') {
      navigate(`/my-path/${item.data._id}`);
    } else if (item.type === 'staticPath') {
      navigate(`/path/${item.pathSlug}`);
    }
  };

  const getInProgressCurriculum = () => {
    return curricula.find(c => !c.completed && c.currentModuleIndex < c.modules.length);
  };

  const activeItems = buildActiveItems();
  const completedItems = buildCompletedItems();

  const filteredActiveItems = activeItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCompletedItems = completedItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const inProgressCurriculum = getInProgressCurriculum();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
        <AppHeader />
        <main className="max-w-7xl mx-auto px-6 py-12 space-y-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-16">

        {/* ZONE 1: Continue Learning */}
        <section className="space-y-6">
          <h1 className="text-4xl font-heading font-bold text-white">
            Welcome back, {user?.name?.split(' ')[0]?.charAt(0).toUpperCase() + user?.name?.split(' ')[0]?.slice(1)}
          </h1>

          {inProgressCurriculum ? (
            <div className="bg-gradient-to-br from-accent-500/20 to-accent-600/10 backdrop-blur-sm border-2 border-accent-500/50 rounded-xl p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-accent-300 font-body text-sm uppercase tracking-wide">Continue Learning</p>
                  <h2 className="text-3xl font-heading font-bold text-white">
                    {getDisplayTitle(inProgressCurriculum)}
                  </h2>
                  <p className="text-primary-200 font-body">{getSubtitle(inProgressCurriculum)}</p>
                  <p className="text-primary-300 font-body text-sm">
                    Module {inProgressCurriculum.currentModuleIndex + 1} of {inProgressCurriculum.modules.length} · {calculateProgress(inProgressCurriculum)}% complete
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/module/${inProgressCurriculum._id}/${inProgressCurriculum.currentModuleIndex}`)}
                  className="px-6 py-3 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-all font-body flex-shrink-0"
                >
                  Continue →
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-sm border border-primary-700 rounded-xl p-8 text-center space-y-4">
              <h2 className="text-2xl font-heading font-bold text-white">Ready to learn something new?</h2>
              <button
                onClick={() => navigate('/')}
                className="px-8 py-4 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-all font-body"
              >
                Start Learning
              </button>
            </div>
          )}
        </section>

        {/* ZONE 2: My Learning */}
        {(filteredActiveItems.length > 0 || searchQuery) && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-3xl font-heading font-bold text-white">My Learning</h2>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 px-4 py-2 bg-white/10 border border-primary-700 rounded-lg text-white placeholder-primary-300 focus:outline-none focus:border-accent-500 transition-colors font-body text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredActiveItems.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleItemClick(item)}
                  className="bg-white/5 backdrop-blur-sm border border-primary-700 rounded-xl p-6 hover:border-accent-500 transition-all duration-200 space-y-4 group cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {(item.type === 'userPath' || item.type === 'staticPath') && (
                        <span className="px-2 py-0.5 bg-accent-500/20 text-accent-400 text-xs rounded-full font-body">Path</span>
                      )}
                      <h4 className="text-lg font-heading font-bold text-white group-hover:text-accent-400 transition-colors">
                        {item.title}
                      </h4>
                    </div>
                    <p className="text-accent-300 font-body text-sm italic">{item.subtitle}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-body">
                      <span className="text-primary-300">Progress</span>
                      <span className="text-accent-400 font-semibold">{item.progress}%</span>
                    </div>
                    <div className="w-full bg-primary-800 rounded-full h-1.5">
                      <div
                        className="bg-accent-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-primary-400 font-body text-sm">
                    Last updated {formatDate(item.updatedAt)}
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleItemClick(item); }}
                      className="flex-1 px-4 py-2 bg-accent-500/20 text-accent-400 font-semibold rounded-lg hover:bg-accent-500 hover:text-white transition-all font-body text-sm"
                    >
                      Continue
                    </button>
                    {item.type === 'curriculum' && (
                      <button
                        onClick={(e) => handleDeleteCurriculum(item.id, e)}
                        className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all font-body text-sm"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    )}
                    {item.type === 'userPath' && (
                      <button
                        onClick={(e) => handleDeletePath(item.id, e)}
                        className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all font-body text-sm"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredActiveItems.length === 0 && searchQuery && (
              <p className="text-primary-300 font-body text-center py-8">No active learning found matching "{searchQuery}"</p>
            )}
          </section>
        )}

        {/* ZONE 3: Completed */}
        {filteredCompletedItems.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-3xl font-heading font-bold text-white">Completed</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompletedItems.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleItemClick(item)}
                  className="bg-white/5 backdrop-blur-sm border border-primary-700 rounded-xl p-6 hover:border-accent-500 transition-all duration-200 space-y-4 group cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {(item.type === 'userPath' || item.type === 'staticPath') && (
                          <span className="px-2 py-0.5 bg-accent-500/20 text-accent-400 text-xs rounded-full font-body">Path</span>
                        )}
                        <h4 className="text-lg font-heading font-bold text-white group-hover:text-accent-400 transition-colors">
                          {item.title}
                        </h4>
                      </div>
                      <p className="text-accent-300 font-body text-sm italic">{item.subtitle}</p>
                    </div>
                    <div className="text-3xl ml-2">🏆</div>
                  </div>

                  <p className="text-primary-400 font-body text-sm">
                    Completed {formatDate(item.updatedAt)}
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleItemClick(item); }}
                      className="flex-1 px-4 py-2 bg-primary-700/50 text-primary-200 font-semibold rounded-lg hover:bg-primary-700 hover:text-white transition-all font-body text-sm"
                    >
                      Review
                    </button>
                    {item.type === 'curriculum' && (
                      <button
                        onClick={(e) => handleDeleteCurriculum(item.id, e)}
                        className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all font-body text-sm"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    )}
                    {item.type === 'userPath' && (
                      <button
                        onClick={(e) => handleDeletePath(item.id, e)}
                        className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all font-body text-sm"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {activeItems.length === 0 && completedItems.length === 0 && (
          <section className="text-center py-20 space-y-4">
            <p className="text-primary-300 font-body text-xl">You haven't started learning yet.</p>
            <button
              onClick={() => navigate('/')}
              className="px-8 py-4 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-all font-body"
            >
              Start Learning
            </button>
          </section>
        )}

      </main>
    </div>
  );
}

export default Dashboard;