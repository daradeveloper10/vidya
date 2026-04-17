import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function Learn() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  const { topic, duration, pathData } = location.state || {};

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
      const { topic: currTopic, duration: currDuration, clarificationAnswers, pathData: currPathData } = location.state;

      const response = await api.post('/api/curriculum/generate', {
        topic: currTopic,
        duration: currDuration,
        clarificationAnswers: clarificationAnswers || []
      });

      const curriculumId = response.data.curriculumId;

      // If part of a user-generated path, create path in background — fire and forget
      if (currPathData && curriculumId) {
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
              curriculumId,
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

      // Navigate to dashboard — path creation continues in background
      setTimeout(() => {
        navigate('/dashboard', {
          state: { newCurriculumId: curriculumId }
        });
      }, 1500);

    } catch (error) {
      navigate('/');
    }
  };

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

export default Learn;