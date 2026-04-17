import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppHeader from '../components/ui/AppHeader';
import api from '../services/api';

function PathDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [path, setPath] = useState(null);
  const [userPath, setUserPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem('pendingPath', slug);
      navigate('/');
      return;
    }
    fetchPath();
  }, [slug, isAuthenticated]);

  const fetchPath = async () => {
    try {
      const response = await api.get(`/api/paths/${slug}`);
      setPath(response.data.path);
      setUserPath(response.data.userPath);
    } catch (err) {
      console.error('Error fetching path:', err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleStartPath = async () => {
    try {
      setStarting(true);
      await api.post(`/api/paths/${slug}/start`);
      const firstCourse = path.courses[0];
      navigate('/learn', {
        state: {
          topic: firstCourse.topic,
          duration: firstCourse.estimatedTime,
          pathSlug: slug,
          courseIndex: 0,
        }
      });
    } catch (err) {
      console.error('Error starting path:', err);
      setStarting(false);
    }
  };

  const handleContinuePath = () => {
    if (!userPath || !path) return;
    const currentCourse = path.courses[userPath.currentCourseIndex];
    navigate('/learn', {
      state: {
        topic: currentCourse.topic,
        duration: currentCourse.estimatedTime,
        pathSlug: slug,
        courseIndex: userPath.currentCourseIndex,
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex items-center justify-center">
        <div className="text-white text-xl font-body">Loading...</div>
      </div>
    );
  }

  if (!path) return null;

  const isEnrolled = !!userPath;
  const completedCount = userPath?.completedCourses?.length || 0;
  const totalCourses = path.courses.length;
  const progressPercent = Math.round((completedCount / totalCourses) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">

        <section className="space-y-4">
          <button
            onClick={() => navigate(-1)}
            className="text-primary-300 hover:text-white transition-colors font-body text-sm"
          >
            ← Back
          </button>
          <h1 className="text-3xl sm:text-5xl font-heading font-bold text-white">
            {path.title}
          </h1>
          <p className="text-lg text-primary-200 font-body">{path.description}</p>

          <div className="bg-accent-500/10 border border-accent-500/30 rounded-xl p-6">
            <p className="text-accent-300 font-body text-sm uppercase tracking-wide mb-2">Your Goal</p>
            <p className="text-white font-body">{path.goal}</p>
          </div>

          {isEnrolled && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-body">
                <span className="text-primary-300">{completedCount} of {totalCourses} courses complete</span>
                <span className="text-accent-400 font-semibold">{progressPercent}%</span>
              </div>
              <div className="w-full bg-primary-800 rounded-full h-2">
                <div
                  className="bg-accent-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={isEnrolled ? handleContinuePath : handleStartPath}
            disabled={starting || userPath?.completed}
            className="px-8 py-4 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-all duration-200 shadow-lg font-body text-lg disabled:opacity-50"
          >
            {starting ? 'Starting...' :
             userPath?.completed ? '🏆 Path Complete!' :
             isEnrolled ? `Continue → ${path.courses[userPath.currentCourseIndex]?.title}` :
             'Start Path'}
          </button>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-heading font-bold text-white">What You'll Learn</h2>
          <div className="space-y-3">
            {path.courses.map((course, index) => {
              const isCompleted = userPath?.completedCourses?.includes(index);
              const isCurrent = isEnrolled && userPath?.currentCourseIndex === index && !userPath?.completed;
              return (
                <div
                  key={index}
                  className={`p-6 rounded-xl border transition-all duration-200 ${
                    isCompleted ? 'bg-accent-500/10 border-accent-500/30' :
                    isCurrent ? 'bg-white/10 border-accent-500' :
                    'bg-white/5 border-primary-700'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isCompleted ? 'bg-accent-500 text-white' :
                      isCurrent ? 'bg-accent-500/30 text-accent-400 border border-accent-500' :
                      'bg-primary-800 text-primary-400'
                    }`}>
                      {isCompleted ? '✓' : index + 1}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-heading font-semibold text-white">{course.title}</h3>
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-accent-500/20 text-accent-400 text-xs rounded-full font-body">Up next</span>
                        )}
                        {isCompleted && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full font-body">Complete</span>
                        )}
                      </div>
                      <p className="text-primary-300 font-body text-sm">{course.description}</p>
                      <p className="text-primary-400 font-body text-xs">⏱ {course.estimatedTime}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

export default PathDetail;
