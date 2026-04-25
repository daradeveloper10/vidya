import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PathBuilder from '../components/curriculum/PathBuilder';
import api from '../services/api';

function Learn() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [curriculum, setCurriculum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPathPrompt, setShowPathPrompt] = useState(false);
  const [pathBuilderVisible, setPathBuilderVisible] = useState(false);

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
    generateCurriculum();
  }, [location.state, navigate]);

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
              <p className="text-2xl">Topic: <span className="text-white">{topic}</span></p>
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
              Topic: <span className="text-white">{topic}</span>
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
                  Claude can suggest follow-on topics to build on <span className="text-white font-semibold">{topic}</span> and create a structured learning journey.
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
                navigate('/learn', {
                  state: {
                    ...location.state,
                    pathData,
                  }
                });
              }}
              onSkip={() => setPathBuilderVisible(false)}
            />
          )}

          {/* Start Learning button */}
          {!pathBuilderVisible && (
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