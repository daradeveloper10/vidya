import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppHeader from '../components/ui/AppHeader';
import api from '../services/api';

function UserPathDetail() {
  const { pathId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [path, setPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    fetchPath();
  }, [pathId, isAuthenticated]);

  const fetchPath = async () => {
    try {
      const response = await api.get(`/api/user-paths/${pathId}`);
      const data = response.data;
      setPath(data);
      setExpandedIndex(data.currentCurriculumIndex || 0);
    } catch (err) {
      console.error('Error fetching path:', err);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getCurriculumId = (curriculum) => {
    if (!curriculum.curriculumId) return null;
    if (typeof curriculum.curriculumId === 'object') return curriculum.curriculumId._id;
    return curriculum.curriculumId;
  };

  const getModules = (curriculum) => {
    if (!curriculum.curriculumId) return [];
    if (typeof curriculum.curriculumId === 'object') return curriculum.curriculumId.modules || [];
    return [];
  };

  const handleContinue = () => {
    const current = path.curricula[path.currentCurriculumIndex];
    const id = getCurriculumId(current);
    if (id) {
      const modules = getModules(current);
      const nextIncomplete = modules.findIndex(m => !m.completed);
      const moduleIndex = nextIncomplete >= 0 ? nextIncomplete : 0;
      navigate(`/module/${id}/${moduleIndex}`);
    }
  };

  const handleModuleClick = (curriculum, moduleIndex) => {
    const id = getCurriculumId(curriculum);
    if (id) navigate(`/module/${id}/${moduleIndex}`);
  };

  const handleContinueCurriculum = (curriculum) => {
    const id = getCurriculumId(curriculum);
    if (!id) return;
    const modules = getModules(curriculum);
    const nextIncomplete = modules.findIndex(m => !m.completed);
    const moduleIndex = nextIncomplete >= 0 ? nextIncomplete : 0;
    navigate(`/module/${id}/${moduleIndex}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex items-center justify-center">
        <div className="text-white text-xl font-body">Loading your path...</div>
      </div>
    );
  }

  if (!path) return null;

  const completedCount = path.curricula.filter(c => c.completed).length;
  const totalCount = path.curricula.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">

        <button
          onClick={() => navigate('/dashboard')}
          className="text-primary-300 hover:text-white transition-colors font-body text-sm"
        >
          ← Back to Dashboard
        </button>

        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-accent-400 font-body text-xs uppercase tracking-wide">Custom Learning Path</p>
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-white">{path.name}</h1>
            {path.description && (
              <p className="text-primary-200 font-body">{path.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-primary-300 font-body text-sm">{completedCount} of {totalCount} curricula complete</p>
              <p className="text-accent-400 font-body font-semibold text-sm">{progressPercent}%</p>
            </div>
            <div className="w-full bg-primary-800 rounded-full h-1.5">
              <div
                className="bg-accent-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {path.status !== 'completed' && (
            <button
              onClick={handleContinue}
              className="px-8 py-3 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-all font-body"
            >
              Continue Learning →
            </button>
          )}
          {path.status === 'completed' && (
            <p className="text-green-400 font-body font-semibold">🏆 Path Complete!</p>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-primary-300 font-body text-xs uppercase tracking-wide">Your curricula</p>

          {path.curricula.map((curriculum, index) => {
            const isCompleted = curriculum.completed;
            const isCurrent = path.currentCurriculumIndex === index && path.status !== 'completed';
            const isExpanded = expandedIndex === index;
            const modules = getModules(curriculum);
            const curriculumId = getCurriculumId(curriculum);
            const isFuture = index > path.currentCurriculumIndex;

            return (
              <div
                key={index}
                className={`rounded-xl border overflow-hidden transition-all duration-200 ${
                  isCurrent
                    ? 'border-accent-500 bg-accent-500/5'
                    : isCompleted
                    ? 'border-accent-500/30 bg-white/5'
                    : 'border-primary-700 bg-white/5'
                } ${isFuture ? 'opacity-60' : ''}`}
              >
                <button
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-white/5 transition-colors"
                >
                  <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCompleted
                      ? 'bg-accent-500 text-white'
                      : isCurrent
                      ? 'border border-accent-500 text-accent-400'
                      : 'bg-primary-800 text-primary-400'
                  }`}>
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-body font-semibold text-sm">{curriculum.title || curriculum.topic}</p>
                      {isCompleted && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full font-body">Complete</span>
                      )}
                      {isCurrent && !isCompleted && (
                        <span className="px-2 py-0.5 bg-accent-500/20 text-accent-400 text-xs rounded-full font-body">Up next</span>
                      )}
                    </div>
                    <p className="text-primary-400 font-body text-xs mt-0.5">{curriculum.duration}</p>
                  </div>
                  <span className="text-primary-400 text-xs flex-shrink-0">{isExpanded ? '▾' : '▸'}</span>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-4 border-t border-primary-700/50">
                    {!curriculumId ? (
                      <div className="py-4 text-center">
                        <p className="text-primary-400 font-body text-sm">Curriculum is being generated in the background...</p>
                      </div>
                    ) : modules.length === 0 ? (
                      <div className="py-4 text-center space-y-2">
                        <p className="text-primary-400 font-body text-sm">No modules yet.</p>
                        <button
                          onClick={() => navigate(`/module/${curriculumId}/0`)}
                          className="px-4 py-2 bg-accent-500/20 text-accent-400 rounded-lg hover:bg-accent-500 hover:text-white transition-colors font-body text-sm"
                        >
                          Start curriculum →
                        </button>
                      </div>
                    ) : (
                      <div className="pt-3 space-y-1">
                        {modules.map((module, mIndex) => (
                          <button
                            key={mIndex}
                            onClick={() => handleModuleClick(curriculum, mIndex)}
                            className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left hover:bg-white/10 transition-colors"
                          >
                            <div className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center ${
                              module.completed
                                ? 'bg-accent-500 border-accent-500'
                                : 'border-primary-600'
                            }`}>
                              {module.completed && <span className="text-white text-xs">✓</span>}
                            </div>
                            <p className={`font-body text-sm flex-1 text-left ${module.completed ? 'text-primary-400' : 'text-primary-200'}`}>
                              {module.title}
                            </p>
                            <p className="text-primary-500 font-body text-xs flex-shrink-0">{module.estimatedTime}</p>
                          </button>
                        ))}
                        <button
                          onClick={() => handleContinueCurriculum(curriculum)}
                          className="w-full mt-2 px-4 py-2 border border-primary-700 text-primary-300 rounded-lg hover:bg-white/10 hover:text-white transition-colors font-body text-sm"
                        >
                          {isCompleted ? 'Review curriculum →' : 'Continue curriculum →'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </main>
    </div>
  );
}

export default UserPathDetail;