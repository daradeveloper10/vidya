import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import PathBuilder from '../components/curriculum/PathBuilder';
import api from '../services/api';

function Learn() {
  function toTitleCase(str) {
    if (!str) return '';
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const hasGenerated = useRef(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [curriculum, setCurriculum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPathPrompt, setShowPathPrompt] = useState(false);
  const [pathBuilderVisible, setPathBuilderVisible] = useState(false);
  const [pathConfirmationData, setPathConfirmationData] = useState(null);

  const { topic, duration, pathData, topicType } = location.state || {};

  const loadingMessages = [
    `Thinking deeply about ${topic}...`,
    `Mapping out your learning journey...`,
    `Structuring concepts from simple to complex...`,
    `Building your personalised curriculum...`,
    `Organising everything that matters...`,
    `Crafting your path through ${topic}...`,
    `Pulling the key ideas together...`,
    `Almost ready to begin...`
  ];

  useEffect(() => {
    if (!location.state || !location.state.topic || !location.state.duration) {
      navigate('/');
      return;
    }
    if (hasGenerated.current) return;
    hasGenerated.current = true;
    generateCurriculum();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [loadingMessages.length]);

  const generateCurriculum = async () => {
    try {
      const { topic: currTopic, duration: currDuration, clarificationAnswers, pathData: currPathData, topicType: currTopicType } = location.state;

      const response = await api.post('/api/curriculum/generate', {
        topic: currTopic,
        duration: currDuration,
        clarificationAnswers: clarificationAnswers || []
      });

      const curriculumData = response.data;
      setCurriculum(curriculumData);
      setLoading(false);

      // Determine if we should show the path prompt
      const DURATIONS_WITH_PATH_OFFER = ['5hrs', '10hrs', '20hrs'];
      if (DURATIONS_WITH_PATH_OFFER.includes(currDuration) && currTopicType !== 'concept' && !currPathData) {
        setShowPathPrompt(true);
      }

      // If part of a user-generated path, create path in background — fire and forget
      if (currPathData && curriculumData.curriculumId) {
        (async () => {
          try {
            // Create the path
            const pathResponse = await api.post('/api/user-paths/create', {
              pathName: currPathData.pathName,
              pathDescription: currPathData.pathDescription,
              curricula: currPathData.curricula,
            });

            const newPathId = pathResponse.data.pathId;

            // Link first curriculum
            await api.post(`/api/user-paths/${newPathId}/add-curriculum`, {
              curriculumId: curriculumData.curriculumId,
              order: 0,
            });

            // Generate and link remaining curricula sequentially in background
            const remainingCurricula = currPathData.curricula.slice(1);
            for (let i = 0; i < remainingCurricula.length; i++) {
              try {
                const c = remainingCurricula[i];
                const genResponse = await api.post('/api/curriculum/generate', {
                  topic: c.topic,
                  duration: c.duration,
                  clarificationAnswers: [],
                });
                if (genResponse.data.curriculumId) {
                  await api.post(`/api/user-paths/${newPathId}/add-curriculum`, {
                    curriculumId: genResponse.data.curriculumId,
                    order: i + 1,
                  });
                }
              } catch (err) {
                console.error(`Error generating curriculum ${i + 1} in path:`, err.message);
              }
            }
          } catch (err) {
            console.error('Error creating user path:', err.message);
          }
        })();
      }

    } catch (error) {
      navigate('/');
    }
  };

  const handleStartLearning = () => {
    navigate('/dashboard', {
      state: { newCurriculumId: curriculum.curriculumId }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center space-y-8 animate-fade-in">
            <h1 className="text-5xl font-heading font-bold text-white">
              {pathData ? 'Building Your Learning Path' : 'Generating Your Curriculum'}
            </h1>

            <div className="space-y-4 text-primary-200 font-body">
              <p className="text-2xl">Topic: <span className="text-white">{toTitleCase(topic)}</span></p>
              <p className="text-2xl">Duration: <span className="text-white">{duration}</span></p>
              {pathData && (
                <p className="text-lg text-accent-400">
                  Path: <span className="text-white">{pathData.pathName}</span>
                </p>
              )}
            </div>

            <div className="pt-8 space-y-6">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-accent-500"></div>
              <p className="text-2xl text-accent-400 font-body font-semibold transition-opacity duration-500">
                {pathData
                  ? `Setting up your ${pathData.curricula?.length || ''} curriculum path...`
                  : loadingMessages[loadingMessageIndex]}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-8 animate-fade-in">
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-heading font-bold text-white">
              Your Curriculum is Ready!
            </h1>
            <p className="text-2xl text-primary-200 font-body">
              Topic: <span className="text-white">{toTitleCase(topic)}</span>
            </p>
          </div>

          {/* Curriculum modules */}
          {curriculum?.modules && (
            <div className="space-y-4">
              <h2 className="text-2xl font-heading font-bold text-white">Modules</h2>
              <div className="space-y-3">
                {curriculum.modules.map((module, index) => (
                  <div key={index} className="p-4 bg-white/10 backdrop-blur-sm border border-primary-700 rounded-lg">
                    <h3 className="text-lg font-semibold text-white font-body">{module.title}</h3>
                    <p className="text-primary-200 font-body text-sm mt-1">{module.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Path prompt */}
          {showPathPrompt && !pathBuilderVisible && (
            <div className="p-6 bg-accent-500/10 border border-accent-500/30 rounded-xl space-y-4">
              <div className="space-y-2">
                <p className="text-accent-400 font-heading font-bold text-lg">Turn this into a learning path?</p>
                <p className="text-primary-200 font-body">
                  Claude can suggest follow-on topics to build on <span className="text-white font-semibold">{toTitleCase(topic)}</span> and create a structured learning journey.
                </p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => setPathBuilderVisible(true)}
                  className="px-6 py-3 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-colors font-body"
                >
                  Build a Learning Path →
                </button>
                <button
                  onClick={() => setShowPathPrompt(false)}
                  className="px-6 py-3 text-primary-300 hover:text-white transition-colors font-body"
                >
                  No thanks, just this curriculum
                </button>
              </div>
            </div>
          )}

          {/* PathBuilder */}
          {pathBuilderVisible && (
            <PathBuilder
              topic={location.state?.topic}
              duration={location.state?.duration}
              clarificationAnswers={location.state?.clarificationAnswers || []}
              topicType={location.state?.topicType || 'skill'}
              onConfirm={(pathData) => {
                setPathConfirmationData(pathData);
                setPathBuilderVisible(false);
                setShowPathPrompt(false);
              }}
              onSkip={() => setPathBuilderVisible(false)}
            />
          )}

          {/* Path confirmation */}
          {pathConfirmationData && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-heading font-bold text-white">Ready to commit?</h2>
                <p className="text-primary-300 font-body">Here's your learning path</p>
              </div>

              <div className="bg-accent-500/10 border border-accent-500/30 rounded-xl p-6 space-y-4">
                <div className="space-y-1">
                  <p className="text-primary-400 font-body text-sm uppercase tracking-wide">Path Name</p>
                  <p className="text-white font-heading font-bold text-2xl">{pathConfirmationData.pathName}</p>
                  {pathConfirmationData.pathDescription && (
                    <p className="text-primary-300 font-body text-sm">{pathConfirmationData.pathDescription}</p>
                  )}
                </div>

                <div className="pt-3 border-t border-accent-500/20 space-y-2">
                  {pathConfirmationData.curricula?.map((c, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          c.locked ? 'bg-accent-500 text-white' : 'bg-primary-700 text-primary-300'
                        }`}>
                          {c.locked ? '★' : i + 1}
                        </div>
                        <p className="text-primary-200 font-body text-sm">{c.title || c.topic}</p>
                      </div>
                      <p className="text-primary-400 font-body text-sm flex-shrink-0 ml-4">{c.duration}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-accent-500/20 flex items-center justify-between">
                  <p className="text-primary-300 font-body text-sm">{pathConfirmationData.curricula?.length} topics</p>
                  <p className="text-accent-400 font-body font-semibold">
                    {pathConfirmationData.curricula?.reduce((sum, c) => {
                      const map = { '10min': 0.17, '30min': 0.5, '2hrs': 2, '5hrs': 5, '10hrs': 10, '20hrs': 20, '30hrs': 30 };
                      return sum + (map[c.duration] || 2);
                    }, 0)}hrs total
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    navigate('/learn', {
                      state: {
                        ...location.state,
                        pathData: pathConfirmationData,
                      }
                    });
                  }}
                  className="w-full px-8 py-4 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-all duration-200 shadow-lg font-body text-lg"
                >
                  Confirm & Start Learning →
                </button>

                <button
                  onClick={() => {
                    setPathConfirmationData(null);
                    setPathBuilderVisible(true);
                  }}
                  className="w-full px-8 py-4 bg-white/5 border border-primary-700 text-primary-200 font-body rounded-lg hover:bg-white/10 transition-colors"
                >
                  ← Edit path
                </button>

                <button
                  onClick={() => {
                    setPathConfirmationData(null);
                    setShowPathPrompt(true);
                  }}
                  className="w-full px-4 py-2 text-primary-400 hover:text-white transition-colors font-body text-sm text-center"
                >
                  ← Skip path, just the curriculum
                </button>
              </div>
            </div>
          )}

          {/* Start Learning button */}
          {!pathBuilderVisible && !pathConfirmationData && (
            <div className="text-center pt-4">
              <button
                onClick={handleStartLearning}
                className="px-8 py-4 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-all duration-200 shadow-lg font-body text-lg"
              >
                Start Learning →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Learn;