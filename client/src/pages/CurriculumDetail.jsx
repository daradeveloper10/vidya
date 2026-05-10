import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppHeader from '../components/ui/AppHeader';
import api from '../services/api';

function CurriculumDetail() {
  const { curriculumId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [curriculum, setCurriculum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(0);
  const [moduleOutcomes, setModuleOutcomes] = useState({});
  const [loadingOutcomes, setLoadingOutcomes] = useState({});
  const [expandedMobileModule, setExpandedMobileModule] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    fetchCurriculum();
  }, [curriculumId, isAuthenticated]);

  useEffect(() => {
    if (!curriculum) return;
    fetchOutcomes(selectedModuleIndex);
  }, [selectedModuleIndex, curriculum]);

  const fetchCurriculum = async () => {
    try {
      const response = await api.get(`/api/curriculum/${curriculumId}`);
      const data = response.data;
      setCurriculum(data);
      const nextIndex = data.modules.findIndex(m => !m.completed);
      const startIndex = nextIndex >= 0 ? nextIndex : 0;
      setSelectedModuleIndex(startIndex);
      setExpandedMobileModule(startIndex);

      // Pre-populate outcomes from cached data
      const cachedOutcomes = {};
      data.modules.forEach((mod, i) => {
        if (mod.outcomes && mod.outcomes.length > 0) {
          cachedOutcomes[i] = mod.outcomes;
        }
      });
      if (Object.keys(cachedOutcomes).length > 0) {
        setModuleOutcomes(cachedOutcomes);
      }
    } catch (err) {
      console.error('Error fetching curriculum:', err);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchOutcomes = async (moduleIndex) => {
    if (moduleOutcomes[moduleIndex]) return;
    try {
      setLoadingOutcomes(prev => ({ ...prev, [moduleIndex]: true }));
      const response = await api.post(`/api/curriculum/${curriculumId}/module-outcomes`, { moduleIndex });
      setModuleOutcomes(prev => ({ ...prev, [moduleIndex]: response.data.outcomes }));
    } catch (err) {
      console.error('Error fetching outcomes:', err);
    } finally {
      setLoadingOutcomes(prev => ({ ...prev, [moduleIndex]: false }));
    }
  };

  const handleModuleSelect = (index) => {
    setSelectedModuleIndex(index);
    setExpandedMobileModule(index);
  };

  const handleModuleClick = (moduleIndex) => {
    navigate(`/module/${curriculumId}/${moduleIndex}`);
  };

  const calculateProgress = () => {
    if (!curriculum?.modules?.length) return 0;
    const completed = curriculum.modules.filter(m => m.completed).length;
    return Math.round((completed / curriculum.modules.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex items-center justify-center">
        <div className="text-white text-xl font-body">Loading...</div>
      </div>
    );
  }

  if (!curriculum) return null;

  const progress = calculateProgress();
  const completedCount = curriculum.modules.filter(m => m.completed).length;
  const isCompleted = curriculum.completed;
  const selectedModule = curriculum.modules[selectedModuleIndex];
  const isSelectedCompleted = selectedModule?.completed;
  const isSelectedCurrent = !isSelectedCompleted && selectedModuleIndex === curriculum.modules.findIndex(m => !m.completed);
  const backPath = location.state?.fromPath ? `/my-path/${location.state.fromPath}` : '/dashboard';
  const outcomes = moduleOutcomes[selectedModuleIndex] || [];
  const isLoadingOutcomes = loadingOutcomes[selectedModuleIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
      <AppHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-28 lg:pb-8">

        {/* Top progress bar + back */}
        <div className="space-y-1 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(backPath)}
              className="text-primary-300 hover:text-white transition-colors font-body text-sm"
            >
              ← Back
            </button>
            <p className="text-primary-400 font-body text-xs">
              {completedCount} of {curriculum.modules.length} modules · {progress}%
            </p>
          </div>
          <div className="w-full bg-primary-800 rounded-full h-1">
            <div
              className="bg-accent-500 h-1 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Course header */}
        <div className="mb-6 space-y-1">
          <p className="text-accent-400 font-body text-xs uppercase tracking-wide">{curriculum.duration} course</p>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-white">
            {curriculum.displayTitle || curriculum.topic}
          </h1>
          {curriculum.subtitle && (
            <p className="text-primary-200 font-body text-lg italic">{curriculum.subtitle}</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-white/5 border border-primary-700 rounded-xl p-4 text-center">
            <p className="text-2xl font-heading font-bold text-white">{curriculum.modules.length}</p>
            <p className="text-primary-400 font-body text-xs mt-1">modules</p>
          </div>
          <div className="bg-white/5 border border-primary-700 rounded-xl p-4 text-center">
            <p className="text-2xl font-heading font-bold text-white">{curriculum.duration}</p>
            <p className="text-primary-400 font-body text-xs mt-1">duration</p>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-white/5 border border-primary-700 rounded-xl p-4 text-center">
            <p className="text-2xl font-heading font-bold text-accent-400">{progress}%</p>
            <p className="text-primary-400 font-body text-xs mt-1">complete</p>
          </div>
        </div>

        {/* Two column layout */}
        <div className="flex gap-6 items-start">

          {/* Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-6">
            <div className="bg-white/5 border border-primary-700 rounded-xl overflow-hidden">
              <div className="px-4 py-4 border-b border-primary-700 space-y-2">
                <p className="text-primary-400 font-body text-xs uppercase tracking-wide">Course content</p>
                <p className="text-white font-body text-sm font-semibold">
                  {completedCount} of {curriculum.modules.length} modules complete
                </p>
                <div className="w-full bg-primary-800 rounded-full h-1">
                  <div
                    className="bg-accent-500 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <div className="py-2">
                {curriculum.modules.map((module, index) => {
                  const isModuleCompleted = module.completed;
                  const isActive = index === selectedModuleIndex;
                  return (
                    <button
                      key={index}
                      onClick={() => handleModuleSelect(index)}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5 ${
                        isActive ? 'border-l-2 border-accent-500 bg-accent-500/5 pl-3.5' : ''
                      }`}
                    >
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                        isModuleCompleted
                          ? 'bg-accent-500'
                          : isActive
                          ? 'border border-accent-500'
                          : 'border border-primary-600'
                      }`}>
                        {isModuleCompleted ? (
                          <span className="text-white text-xs">✓</span>
                        ) : (
                          <span className={`text-xs ${isActive ? 'text-accent-400' : 'text-primary-500'}`}>
                            {index + 1}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-body text-xs leading-snug ${
                          isModuleCompleted ? 'text-primary-400' : isActive ? 'text-white font-semibold' : 'text-primary-300'
                        }`}>
                          {module.title}
                        </p>
                        <p className="text-primary-500 font-body text-xs mt-0.5">{module.estimatedTime}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Main — selected module detail */}
          <main className="flex-1 min-w-0">

            {/* Desktop module detail */}
            <div className="hidden lg:block">
              {selectedModule && (
                <div className="space-y-6">

                  {/* Module header */}
                  <div className={`p-6 rounded-xl border ${
                    isSelectedCompleted
                      ? 'border-accent-500/30 bg-accent-500/5'
                      : isSelectedCurrent
                      ? 'border-accent-500 bg-accent-500/5'
                      : 'border-primary-700 bg-white/5'
                  }`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-primary-400 font-body text-xs uppercase tracking-wide">
                            Module {selectedModuleIndex + 1} of {curriculum.modules.length}
                          </p>
                          {isSelectedCompleted && (
                            <span className="px-2 py-0.5 bg-accent-500/20 text-accent-400 text-xs rounded-full font-body">Complete</span>
                          )}
                          {isSelectedCurrent && !isSelectedCompleted && (
                            <span className="px-2 py-0.5 bg-accent-500/20 text-accent-400 text-xs rounded-full font-body">
                              {completedCount === 0 ? 'Start here' : 'Up next'}
                            </span>
                          )}
                        </div>
                        <h2 className="text-2xl font-heading font-bold text-white">{selectedModule.title}</h2>
                        <p className="text-primary-200 font-body">{selectedModule.description}</p>
                        <p className="text-primary-400 font-body text-sm">⏱ {selectedModule.estimatedTime}</p>
                      </div>
                      <button
                        onClick={() => handleModuleClick(selectedModuleIndex)}
                        className={`flex-shrink-0 px-6 py-3 font-semibold rounded-lg transition-all font-body ${
                          isSelectedCompleted
                            ? 'bg-white/10 text-primary-200 hover:bg-white/20'
                            : 'bg-accent-500 text-white hover:bg-accent-600'
                        }`}
                      >
                        {isSelectedCompleted ? 'Review →' : completedCount === 0 && selectedModuleIndex === 0 ? 'Start →' : 'Go to module →'}
                      </button>
                    </div>
                  </div>

                  {/* Learning outcomes */}
                  <div className="bg-white/5 border border-primary-700 rounded-xl p-6 space-y-4">
                    <h3 className="text-lg font-heading font-semibold text-white">
                      By the end of this module you will...
                    </h3>
                    {isLoadingOutcomes ? (
                      <div className="space-y-2">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="flex items-start gap-3 animate-pulse">
                            <div className="w-4 h-4 rounded-full bg-white/10 flex-shrink-0 mt-1"></div>
                            <div className="h-4 bg-white/10 rounded flex-1"></div>
                          </div>
                        ))}
                      </div>
                    ) : outcomes.length > 0 ? (
                      <ul className="space-y-3">
                        {outcomes.map((outcome, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-500/20 border border-accent-500/40 flex items-center justify-center mt-0.5">
                              <span className="text-accent-400 text-xs font-semibold">{i + 1}</span>
                            </div>
                            <p className="text-primary-200 font-body text-sm leading-relaxed">{outcome}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-primary-400 font-body text-sm">Loading outcomes...</p>
                    )}
                  </div>

                  {/* Score if completed */}
                  {isSelectedCompleted && selectedModule.score !== undefined && (
                    <div className="bg-white/5 border border-primary-700 rounded-xl p-5 flex items-center gap-4">
                      <div className="text-3xl">🏆</div>
                      <div>
                        <p className="text-white font-body font-semibold">Module Complete</p>
                        <p className="text-primary-300 font-body text-sm">
                          You scored <span className="text-accent-400 font-semibold">{selectedModule.score}%</span> on the quiz
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* Mobile module list */}
            <div className="lg:hidden space-y-2">
              {curriculum.modules.map((module, index) => {
                const isModuleCompleted = module.completed;
                const isCurrentModule = index === curriculum.modules.findIndex(m => !m.completed) && !isCompleted;
                const isExpanded = expandedMobileModule === index;
                const mobileOutcomes = moduleOutcomes[index] || [];
                const isMobileLoadingOutcomes = loadingOutcomes[index];
                return (
                  <div
                    key={index}
                    className={`rounded-xl border overflow-hidden transition-all duration-200 ${
                      isCurrentModule
                        ? 'border-accent-500 bg-accent-500/5'
                        : isModuleCompleted
                        ? 'border-primary-700/50 bg-white/5'
                        : 'border-primary-700 bg-white/5'
                    }`}
                  >
                    <button
                      onClick={() => {
                        const newExpanded = isExpanded ? null : index;
                        setExpandedMobileModule(newExpanded);
                        if (newExpanded !== null) fetchOutcomes(index);
                      }}
                      className="w-full flex items-center gap-3 p-4 text-left"
                    >
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                        isModuleCompleted
                          ? 'bg-accent-500'
                          : isCurrentModule
                          ? 'border border-accent-500'
                          : 'border border-primary-600'
                      }`}>
                        {isModuleCompleted ? (
                          <span className="text-white text-xs">✓</span>
                        ) : (
                          <span className={`text-xs ${isCurrentModule ? 'text-accent-400' : 'text-primary-500'}`}>
                            {index + 1}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-body text-sm font-semibold ${
                          isModuleCompleted ? 'text-primary-400' : isCurrentModule ? 'text-white' : 'text-primary-200'
                        }`}>
                          {module.title}
                        </p>
                        <p className="text-primary-500 font-body text-xs">⏱ {module.estimatedTime}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        {isModuleCompleted && (
                          <span className="text-accent-400 font-body text-xs hidden xs:block">Done</span>
                        )}
                        {isCurrentModule && !isModuleCompleted && (
                          <span className="px-2 py-0.5 bg-accent-500/20 text-accent-400 text-xs rounded-full font-body whitespace-nowrap">
                            {completedCount === 0 ? 'Start' : 'Next'}
                          </span>
                        )}
                        <span className="text-primary-400 text-sm">{isExpanded ? '▾' : '▸'}</span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-4 border-t border-primary-700/50 pt-4">
                        {module.description && (
                          <p className="text-primary-300 font-body text-sm leading-relaxed">{module.description}</p>
                        )}
                        {isMobileLoadingOutcomes ? (
                          <div className="space-y-2">
                            {[1,2,3,4].map(i => (
                              <div key={i} className="flex items-start gap-2 animate-pulse">
                                <div className="w-4 h-4 rounded-full bg-white/10 flex-shrink-0 mt-1"></div>
                                <div className="h-3 bg-white/10 rounded flex-1"></div>
                              </div>
                            ))}
                          </div>
                        ) : mobileOutcomes.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-primary-400 font-body text-xs uppercase tracking-wide">You will learn to</p>
                            <ul className="space-y-2">
                              {mobileOutcomes.map((outcome, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-accent-400 text-xs mt-1 flex-shrink-0">→</span>
                                  <p className="text-primary-300 font-body text-sm">{outcome}</p>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {isModuleCompleted && module.score !== undefined && (
                          <p className="text-primary-400 font-body text-xs">
                            Quiz score: <span className="text-accent-400 font-semibold">{module.score}%</span>
                          </p>
                        )}
                        <button
                          onClick={() => handleModuleClick(index)}
                          className={`w-full px-4 py-3 font-semibold rounded-lg transition-colors font-body text-sm ${
                            isModuleCompleted
                              ? 'bg-white/10 text-primary-200 hover:bg-white/20'
                              : 'bg-accent-500 text-white hover:bg-accent-600'
                          }`}
                        >
                          {isModuleCompleted ? 'Review module →' : isCurrentModule ? (completedCount === 0 ? 'Start →' : 'Continue →') : 'Go to module →'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </main>
        </div>
      </div>

      {/* Sticky bottom CTA — mobile only */}
      {!isCompleted && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-primary-950/95 backdrop-blur-sm border-t border-primary-700 z-40">
          <button
            onClick={() => handleModuleClick(curriculum.modules.findIndex(m => !m.completed) >= 0 ? curriculum.modules.findIndex(m => !m.completed) : 0)}
            className="w-full px-6 py-4 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-all font-body"
          >
            {completedCount === 0 ? 'Start Learning →' : `Continue → Module ${curriculum.modules.findIndex(m => !m.completed) + 1}`}
          </button>
        </div>
      )}

    </div>
  );
}

export default CurriculumDetail;
