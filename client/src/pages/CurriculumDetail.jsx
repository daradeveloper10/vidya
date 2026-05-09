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

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    fetchCurriculum();
  }, [curriculumId, isAuthenticated]);

  const fetchCurriculum = async () => {
    try {
      const response = await api.get(`/api/curriculum/${curriculumId}`);
      setCurriculum(response.data);
    } catch (err) {
      console.error('Error fetching curriculum:', err);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    const nextIndex = curriculum.currentModuleIndex || 0;
    navigate(`/module/${curriculumId}/${nextIndex}`);
  };

  const handleModuleClick = (moduleIndex) => {
    navigate(`/module/${curriculumId}/${moduleIndex}`);
  };

  const calculateProgress = () => {
    if (!curriculum?.modules?.length) return 0;
    const completed = curriculum.modules.filter(m => m.completed).length;
    return Math.round((completed / curriculum.modules.length) * 100);
  };

  const getNextIncompleteModule = () => {
    if (!curriculum?.modules) return 0;
    const idx = curriculum.modules.findIndex(m => !m.completed);
    return idx >= 0 ? idx : 0;
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
  const currentModuleIndex = getNextIncompleteModule();
  const currentModule = curriculum.modules[currentModuleIndex];
  const isCompleted = curriculum.completed;
  const backPath = location.state?.fromPath
    ? `/my-path/${location.state.fromPath}`
    : '/dashboard';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
      <AppHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Back button */}
        <button
          onClick={() => navigate(backPath)}
          className="text-primary-300 hover:text-white transition-colors font-body text-sm mb-6 block"
        >
          ← Back
        </button>

        {/* Desktop layout: sidebar + main */}
        <div className="flex gap-6 items-start">

          {/* Sidebar — hidden on mobile, visible on lg+ */}
          <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-6">
            <div className="bg-white/5 border border-primary-700 rounded-xl overflow-hidden">

              {/* Sidebar header */}
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

              {/* Module list */}
              <div className="py-2">
                {curriculum.modules.map((module, index) => {
                  const isModuleCompleted = module.completed;
                  const isCurrentModule = index === currentModuleIndex && !isCompleted;
                  return (
                    <button
                      key={index}
                      onClick={() => handleModuleClick(index)}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5 ${
                        isCurrentModule ? 'border-l-2 border-accent-500 bg-accent-500/5 pl-3.5' : ''
                      }`}
                    >
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
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
                        <p className={`font-body text-xs leading-snug ${
                          isModuleCompleted
                            ? 'text-primary-400'
                            : isCurrentModule
                            ? 'text-white font-semibold'
                            : 'text-primary-300'
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

          {/* Main content */}
          <main className="flex-1 min-w-0 space-y-6">

            {/* Course header */}
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-accent-400 font-body text-xs uppercase tracking-wide">
                  {curriculum.duration} course
                </p>
                <h1 className="text-3xl sm:text-4xl font-heading font-bold text-white">
                  {curriculum.displayTitle || curriculum.topic}
                </h1>
                {curriculum.subtitle && (
                  <p className="text-primary-200 font-body text-lg italic">{curriculum.subtitle}</p>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/5 border border-primary-700 rounded-xl p-4 text-center">
                <p className="text-2xl font-heading font-bold text-white">{curriculum.modules.length}</p>
                <p className="text-primary-400 font-body text-xs mt-1">modules</p>
              </div>
              <div className="bg-white/5 border border-primary-700 rounded-xl p-4 text-center">
                <p className="text-2xl font-heading font-bold text-white">{curriculum.duration}</p>
                <p className="text-primary-400 font-body text-xs mt-1">duration</p>
              </div>
              <div className="bg-white/5 border border-primary-700 rounded-xl p-4 text-center">
                <p className="text-2xl font-heading font-bold text-accent-400">{progress}%</p>
                <p className="text-primary-400 font-body text-xs mt-1">complete</p>
              </div>
            </div>

            {/* Continue / completed banner */}
            {!isCompleted && currentModule && (
              <div className="bg-accent-500/10 border border-accent-500/30 rounded-xl p-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <p className="text-accent-400 font-body text-xs uppercase tracking-wide">
                      {completedCount === 0 ? 'Start here' : 'Up next'}
                    </p>
                    <p className="text-white font-heading font-semibold text-lg">{currentModule.title}</p>
                    <p className="text-primary-300 font-body text-sm">
                      Module {currentModuleIndex + 1} of {curriculum.modules.length} · {currentModule.estimatedTime}
                    </p>
                  </div>
                  <button
                    onClick={handleContinue}
                    className="px-6 py-3 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-all font-body flex-shrink-0"
                  >
                    {completedCount === 0 ? 'Start Learning →' : 'Continue →'}
                  </button>
                </div>
              </div>
            )}

            {isCompleted && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5 flex items-center gap-4">
                <span className="text-3xl">🏆</span>
                <div>
                  <p className="text-green-400 font-heading font-bold text-lg">Course Complete!</p>
                  <p className="text-primary-200 font-body text-sm">You've completed all modules in this course.</p>
                </div>
              </div>
            )}

            {/* Mobile module list — only shows on small screens */}
            <div className="lg:hidden space-y-2">
              <p className="text-primary-300 font-body text-xs uppercase tracking-wide">All modules</p>
              {curriculum.modules.map((module, index) => {
                const isModuleCompleted = module.completed;
                const isCurrentModule = index === currentModuleIndex && !isCompleted;
                return (
                  <button
                    key={index}
                    onClick={() => handleModuleClick(index)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-colors ${
                      isCurrentModule
                        ? 'border-accent-500 bg-accent-500/5'
                        : isModuleCompleted
                        ? 'border-primary-700 bg-white/5 opacity-70'
                        : 'border-primary-700 bg-white/5'
                    }`}
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
                      <p className={`font-body text-sm ${isCurrentModule ? 'text-white font-semibold' : 'text-primary-200'}`}>
                        {module.title}
                      </p>
                      <p className="text-primary-400 font-body text-xs">{module.estimatedTime}</p>
                    </div>
                    {isModuleCompleted && (
                      <span className="text-accent-400 font-body text-xs flex-shrink-0">Done</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Desktop full module list below sidebar */}
            <div className="hidden lg:block space-y-3">
              <p className="text-primary-300 font-body text-xs uppercase tracking-wide">All modules</p>
              {curriculum.modules.map((module, index) => {
                const isModuleCompleted = module.completed;
                const isCurrentModule = index === currentModuleIndex && !isCompleted;
                return (
                  <div
                    key={index}
                    onClick={() => handleModuleClick(index)}
                    className={`w-full p-5 rounded-xl border text-left transition-all duration-200 cursor-pointer hover:border-accent-500/50 ${
                      isCurrentModule
                        ? 'border-accent-500 bg-accent-500/5'
                        : isModuleCompleted
                        ? 'border-primary-700/50 bg-white/5 opacity-75'
                        : 'border-primary-700 bg-white/5'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 ${
                        isModuleCompleted
                          ? 'bg-accent-500'
                          : isCurrentModule
                          ? 'border border-accent-500'
                          : 'border border-primary-600'
                      }`}>
                        {isModuleCompleted ? (
                          <span className="text-white text-xs">✓</span>
                        ) : (
                          <span className={`text-xs font-semibold ${isCurrentModule ? 'text-accent-400' : 'text-primary-500'}`}>
                            {index + 1}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <p className={`font-body font-semibold ${
                            isModuleCompleted
                              ? 'text-primary-400'
                              : isCurrentModule
                              ? 'text-white'
                              : 'text-primary-100'
                          }`}>
                            {module.title}
                          </p>
                          {isModuleCompleted && (
                            <span className="px-2 py-0.5 bg-accent-500/20 text-accent-400 text-xs rounded-full font-body">Done</span>
                          )}
                          {isCurrentModule && (
                            <span className="px-2 py-0.5 bg-accent-500/20 text-accent-400 text-xs rounded-full font-body">
                              {completedCount === 0 ? 'Start here' : 'Up next'}
                            </span>
                          )}
                        </div>
                        {module.description && (
                          <p className={`font-body text-sm leading-relaxed ${
                            isModuleCompleted ? 'text-primary-500' : 'text-primary-300'
                          }`}>
                            {module.description}
                          </p>
                        )}
                        <p className="text-primary-500 font-body text-xs">⏱ {module.estimatedTime}</p>
                      </div>
                      {isCurrentModule && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleModuleClick(index); }}
                          className="flex-shrink-0 px-4 py-2 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-colors font-body text-sm"
                        >
                          {completedCount === 0 ? 'Start →' : 'Continue →'}
                        </button>
                      )}
                      {isModuleCompleted && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleModuleClick(index); }}
                          className="flex-shrink-0 px-4 py-2 bg-white/10 text-primary-300 font-semibold rounded-lg hover:bg-white/20 transition-colors font-body text-sm"
                        >
                          Review
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </main>
        </div>
      </div>
    </div>
  );
}

export default CurriculumDetail;