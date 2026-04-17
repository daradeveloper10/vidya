import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppHeader from '../components/ui/AppHeader';
import api from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Paywall from '../components/ui/Paywall';

function Module() {
  console.log('Module version: 2.0 - new messages active');
  
  const { curriculumId, moduleIndex: urlModuleIndex } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const streamBuffer = useRef('');
  
  const markdownComponents = {
    h1: ({children}) => (
      <h1 style={{
        fontSize: '1.875rem',
        fontWeight: '700',
        color: '#ffffff',
        marginTop: '2rem',
        marginBottom: '1rem',
        lineHeight: '1.2'
      }}>{children}</h1>
    ),
    h2: ({children}) => (
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: '700', 
        color: '#ffffff',
        marginTop: '1.75rem',
        marginBottom: '0.75rem',
        lineHeight: '1.3'
      }}>{children}</h2>
    ),
    h3: ({children}) => (
      <h3 style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#e2e8f0',
        marginTop: '1.5rem',
        marginBottom: '0.5rem'
      }}>{children}</h3>
    ),
    p: ({children}) => (
      <p style={{
        color: '#cbd5e1',
        lineHeight: '1.8',
        marginBottom: '1rem',
        fontSize: '1rem'
      }}>{children}</p>
    ),
    strong: ({children}) => (
      <strong style={{
        color: '#ffffff',
        fontWeight: '600'
      }}>{children}</strong>
    ),
    li: ({children}) => (
      <li style={{
        color: '#cbd5e1',
        marginBottom: '0.25rem',
        lineHeight: '1.7'
      }}>{children}</li>
    ),
    ul: ({children}) => (
      <ul style={{
        paddingLeft: '1.5rem',
        marginTop: '0.5rem',
        marginBottom: '1rem'
      }}>{children}</ul>
    ),
    ol: ({children}) => (
      <ol style={{
        paddingLeft: '1.5rem',
        marginTop: '0.5rem',
        marginBottom: '1rem'
      }}>{children}</ol>
    ),
    table: ({children}) => (
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '1rem',
        marginBottom: '1rem'
      }}>{children}</table>
    ),
    th: ({children}) => (
      <th style={{
        color: '#ffffff',
        fontWeight: '600',
        padding: '0.5rem 1rem',
        borderBottom: '2px solid rgba(255,255,255,0.2)',
        textAlign: 'left'
      }}>{children}</th>
    ),
    td: ({children}) => (
      <td style={{
        color: '#cbd5e1',
        padding: '0.5rem 1rem',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>{children}</td>
    ),
  };

  const [moduleIndex, setModuleIndex] = useState(parseInt(urlModuleIndex) || 0);
  const [curriculum, setCurriculum] = useState(null);
  const [lessonContent, setLessonContent] = useState('');
  const [loadingLesson, setLoadingLesson] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [showSummary, setShowSummary] = useState(false);
  const [freeMinutesRemaining, setFreeMinutesRemaining] = useState(30);
  const [explainLoading, setExplainLoading] = useState({});
  const [showPaywall, setShowPaywall] = useState(false);
  const [video, setVideo] = useState(null);
  const [loadingVideo, setLoadingVideo] = useState(false);

  const currentModule = curriculum?.modules?.[moduleIndex] || null;

  useEffect(() => {
    fetchCurriculum();
    startTimeTracking();
    return () => {
      if (window.timeTrackingInterval) {
        clearInterval(window.timeTrackingInterval);
      }
    };
  }, [curriculumId]);

  useEffect(() => {
    if (curriculum && currentModule) {
      document.title = `${currentModule.title} | Vidya`;
    }
    return () => {
      document.title = 'Vidya — Learn Anything';
    };
  }, [curriculum, currentModule]);

  useEffect(() => {
    const controller = new AbortController();
    if (curriculum) {
      fetchLesson(controller);
      fetchVideo();
    }
    return () => {
      controller.abort();
    };
  }, [curriculum, moduleIndex]);

  useEffect(() => {
    if (!loadingLesson) return;

    const getLoadingMessages = () => {
      const topic = curriculum?.topic || 'this topic';
      const duration = curriculum?.duration || '2hrs';

      if (duration === '10min' || duration === '30min') {
        return [
          `Thinking deeply about ${topic}...`,
          `Connecting the key ideas...`,
          `Crafting explanations you'll remember...`,
          `Building your learning experience...`,
          `Organising from simple to complex...`,
          `Almost ready to begin...`
        ];
      } else if (duration === '2hrs') {
        return [
          `Thinking deeply about ${topic}...`,
          `Connecting the key ideas...`,
          `Building your learning experience...`,
          `Organising concepts from simple to complex...`,
          `Crafting explanations you'll actually remember...`,
          `Pulling together everything that matters...`,
          `Making sure this feels just right...`,
          `Structuring your path through ${topic}...`,
          `Almost ready to begin...`,
          `Your lesson is coming together...`
        ];
      } else {
        return [
          `Thinking deeply about ${topic}...`,
          `Going deep on ${topic} for you...`,
          `Connecting the key ideas across the subject...`,
          `Building something comprehensive...`,
          `Organising concepts from simple to complex...`,
          `Crafting explanations you'll actually remember...`,
          `Pulling together everything that matters...`,
          `This one takes a moment — worth the wait...`,
          `Structuring your complete path through ${topic}...`,
          `Making sure every concept flows naturally...`,
          `Depth takes time — almost there...`,
          `Your lesson is coming together...`
        ];
      }
    };

    const messages = getLoadingMessages();
    const duration = curriculum?.duration || '2hrs';
    const interval = duration === '10min' || duration === '30min' ? 1500 : duration === '2hrs' ? 2000 : 3000;

    const timer = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % messages.length);
    }, interval);

    return () => clearInterval(timer);
  }, [loadingLesson, curriculum]);

  const fetchCurriculum = async () => {
    try {
      const response = await api.get(`/api/curriculum/${curriculumId}`);
      setCurriculum(response.data);
      const userResponse = await api.get('/api/auth/me');
      const used = userResponse.data.user.freeMinutesUsed || 0;
      setFreeMinutesRemaining(Math.max(0, 30 - used));
    } catch (error) {
      console.error('Error fetching curriculum:', error);
      navigate('/dashboard');
    }
  };

  const fetchLesson = async (controller) => {
    try {
      setLoadingLesson(true);
      setLessonContent('');
      setIsStreaming(false);
      streamBuffer.current = '';

      const token = localStorage.getItem('vidya_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

      const response = await fetch(`${apiUrl}/api/module/${curriculumId}/${moduleIndex}/lesson`, {
        method: 'POST',
        credentials: 'include',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        setLessonContent(data.content);
        setLoadingLesson(false);
        return;
      }

      setIsStreaming(true);
      setLoadingLesson(false);
      
      const updateInterval = setInterval(() => {
        setLessonContent(streamBuffer.current);
      }, 150);
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              clearInterval(updateInterval);
              setLessonContent(streamBuffer.current);
              setIsStreaming(false);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                streamBuffer.current += parsed.text;
              }
              if (parsed.error) {
                console.error('Streaming error:', parsed.error);
                clearInterval(updateInterval);
                setIsStreaming(false);
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }

      clearInterval(updateInterval);
      setLessonContent(streamBuffer.current);
      setIsStreaming(false);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted');
        return;
      }
      console.error('Error fetching lesson:', error);
      setLoadingLesson(false);
      setIsStreaming(false);
    }
  };

  const startTimeTracking = () => {
    window.timeTrackingInterval = setInterval(async () => {
      try {
        const response = await api.post('/api/module/time', { minutes: 1 });
        setFreeMinutesRemaining(response.data.freeMinutesRemaining);
      } catch (error) {
        console.error('Error tracking time:', error);
      }
    }, 60000);
  };

  const fetchVideo = async () => {
    try {
      // Use curriculum data directly to check cached video
      const mod = curriculum?.modules?.[moduleIndex];
      if (mod?.video?.videoId) {
        setVideo(mod.video);
        return;
      }

      setLoadingVideo(true);
      
      const response = await api.post('/api/video/search', {
        moduleTitle: mod.title,
        curriculumTopic: curriculum.topic,
        moduleDescription: mod.description,
        curriculumId: curriculumId,
        moduleIndex: moduleIndex
      });

      if (response.data.video) {
        setVideo(response.data.video);
      }
    } catch (error) {
      console.error('Error fetching video:', error);
    } finally {
      setLoadingVideo(false);
    }
  };

  const handleExplainDifferently = async (conceptText, blockIndex) => {
    try {
      setExplainLoading({ ...explainLoading, [blockIndex]: true });
      setLessonContent('');
      const response = await api.post(`/api/module/${curriculumId}/${moduleIndex}/explain`, {
        conceptText
      });
      setLessonContent(response.data.explanation);
    } catch (error) {
      console.error('Error getting alternative explanation:', error);
    } finally {
      setExplainLoading({ ...explainLoading, [blockIndex]: false });
    }
  };

  const startQuiz = async () => {
    try {
      const response = await api.post(`/api/module/${curriculumId}/${moduleIndex}/quiz`);
      setQuestions(response.data.questions);
      setShowQuiz(true);
      setCurrentQuestionIndex(0);
      setAnswers([]);
      setSelectedAnswer(null);
    } catch (error) {
      console.error('Error fetching quiz:', error);
    }
  };

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answer === currentQuestion.correctAnswer;
    setAnswers([...answers, { question: currentQuestion.question, selected: answer, correct: isCorrect }]);
    
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(null);
      } else {
        submitQuizScore();
        setShowSummary(true);
      }
    }, 2000);
  };

  const submitQuizScore = async () => {
    try {
      const correct = answers.filter(a => a.correct).length + (selectedAnswer === questions[currentQuestionIndex].correctAnswer ? 1 : 0);
      const total = questions.length;
      await api.post(`/api/module/${curriculumId}/${moduleIndex}/submit`, {
        score: correct,
        totalQuestions: total
      });
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  };

  const calculateScore = () => {
    const correct = answers.filter(a => a.correct).length;
    const percentage = Math.round((correct / answers.length) * 100);
    return { correct, total: answers.length, percentage };
  };

  const getScoreMessage = (percentage) => {
    if (percentage >= 80) return "Excellent work! You're ready for the next module 🎉";
    if (percentage >= 60) return "Good effort! Review the concepts and you'll master this.";
    return "Let's reinforce this before moving on. Consider reviewing the lesson.";
  };

  const goToNextModule = () => {
    if (user?.subscriptionStatus === 'free' && freeMinutesRemaining <= 0) {
      setShowPaywall(true);
      return;
    }
    if (moduleIndex < curriculum.modules.length - 1) {
      setModuleIndex(moduleIndex + 1);
      setShowQuiz(false);
      setShowSummary(false);
      setQuestions([]);
      setAnswers([]);
      window.scrollTo(0, 0);
    } else {
      navigate(`/complete/${curriculumId}`);
    }
  };

  const getBannerColor = () => {
    if (freeMinutesRemaining > 15) return 'bg-primary-800/50 text-primary-300';
    if (freeMinutesRemaining >= 8) return 'bg-amber-900/50 text-amber-300';
    return 'bg-red-900/50 text-red-300';
  };

  if (!curriculum) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
        <div className="text-white text-xl font-body">Loading...</div>
      </div>
    );
  }

  const score = answers.length > 0 ? calculateScore() : null;
  const contentBlocks = lessonContent.split('\n\n').filter(block => block.trim().length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
      {user?.subscriptionStatus === 'free' && (
        <div className={`${getBannerColor()} px-6 py-3 text-center font-body text-sm transition-colors`}>
          ⏱ {freeMinutesRemaining} min of free learning remaining
          {freeMinutesRemaining < 8 && (
            <span className="ml-4 font-semibold">• Unlock unlimited learning →</span>
          )}
        </div>
      )}

      <AppHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-12">
        {!showQuiz && !showSummary && (
          <section className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-4xl font-heading font-bold text-white">{currentModule.title}</h2>
              <p className="text-base sm:text-xl text-primary-200 font-body">{currentModule.description}</p>
              <p className="text-primary-400 font-body">⏱ {currentModule.estimatedTime}</p>
            </div>

            {loadingLesson ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="text-primary-300 font-body text-lg transition-opacity duration-500">
                  {(() => {
                    const topic = curriculum.topic;
                    const duration = curriculum.duration;
                    let messages = [];
                    if (duration === '10min' || duration === '30min') {
                      messages = [
                        `Thinking deeply about ${topic}...`,
                        `Connecting the key ideas...`,
                        `Crafting explanations you'll remember...`,
                        `Building your learning experience...`,
                        `Organising from simple to complex...`,
                        `Almost ready to begin...`
                      ];
                    } else if (duration === '2hrs') {
                      messages = [
                        `Thinking deeply about ${topic}...`,
                        `Connecting the key ideas...`,
                        `Building your learning experience...`,
                        `Organising concepts from simple to complex...`,
                        `Crafting explanations you'll actually remember...`,
                        `Pulling together everything that matters...`,
                        `Making sure this feels just right...`,
                        `Structuring your path through ${topic}...`,
                        `Almost ready to begin...`,
                        `Your lesson is coming together...`
                      ];
                    } else {
                      messages = [
                        `Thinking deeply about ${topic}...`,
                        `Going deep on ${topic} for you...`,
                        `Connecting the key ideas across the subject...`,
                        `Building something comprehensive...`,
                        `Organising concepts from simple to complex...`,
                        `Crafting explanations you'll actually remember...`,
                        `Pulling together everything that matters...`,
                        `This one takes a moment — worth the wait...`,
                        `Structuring your complete path through ${topic}...`,
                        `Making sure every concept flows naturally...`,
                        `Depth takes time — almost there...`,
                        `Your lesson is coming together...`
                      ];
                    }
                    return messages[loadingMessageIndex % messages.length];
                  })()}
                </div>
              </div>
            ) : (
              <>
                {lessonContent && (
                  <>
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '0.75rem', padding: '2rem' }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {lessonContent}
                      </ReactMarkdown>
                    </div>
                    {isStreaming && (
                      <span className="inline-block w-2 h-5 bg-accent-400 animate-pulse ml-1"></span>
                    )}
                  </>
                )}

                {!isStreaming && lessonContent && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={() => handleExplainDifferently(lessonContent, 0)}
                      disabled={explainLoading[0]}
                      className="text-sm text-accent-400 hover:text-accent-300 transition-colors font-body flex items-center gap-2"
                    >
                      {explainLoading[0] ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-accent-400"></div>
                          Generating...
                        </>
                      ) : (
                        <>Explain this differently →</>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}

            {!loadingLesson && !isStreaming && (
              <>
                {loadingVideo && (
                  <div className="text-center py-8">
                    <p className="text-primary-300 font-body">Finding the best video for this topic...</p>
                  </div>
                )}

                {!loadingVideo && video && (
                  <div className="space-y-4">
                    <p className="text-primary-200 font-body text-center italic">
                      {video.contextLine}
                    </p>
                    <div className="relative" style={{ paddingBottom: '56.25%', height: 0 }}>
                      <iframe
                        src={`https://www.youtube.com/embed/${video.videoId}`}
                        title={video.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute top-0 left-0 w-full h-full rounded-lg"
                        style={{ border: 'none' }}
                      />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-white font-body font-semibold">{video.title}</p>
                      <p className="text-primary-400 font-body text-sm">
                        {video.channelTitle} • {video.duration}
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-8 text-center">
                  <button
                    onClick={startQuiz}
                    className="px-8 py-4 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-all duration-200 shadow-lg hover:shadow-xl font-body text-lg"
                  >
                    Test Your Knowledge →
                  </button>
                </div>
              </>
            )}
          </section>
        )}

        {showQuiz && !showSummary && questions.length > 0 && (
          <section className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-heading font-bold text-white">Test Your Knowledge</h2>
              <p className="text-primary-300 font-body">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-primary-700 rounded-xl p-8 space-y-6">
              <h3 className="text-2xl font-heading text-white">
                {questions[currentQuestionIndex].question}
              </h3>

              <div className="space-y-3">
                {questions[currentQuestionIndex].options.map((option, index) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrect = option === questions[currentQuestionIndex].correctAnswer;
                  const showResult = selectedAnswer !== null;

                  let buttonClass = 'bg-white/5 hover:bg-white/10 text-white';
                  if (showResult) {
                    if (isCorrect) buttonClass = 'bg-green-500/20 border-green-500 text-green-300';
                    else if (isSelected) buttonClass = 'bg-red-500/20 border-red-500 text-red-300';
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => !selectedAnswer && handleAnswerSelect(option)}
                      disabled={selectedAnswer !== null}
                      className={`w-full px-6 py-4 rounded-lg border border-primary-700 transition-all duration-200 text-left font-body ${buttonClass}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              {selectedAnswer && (
                <div className="pt-4 border-t border-primary-700">
                  <p className="text-primary-200 font-body">
                    {questions[currentQuestionIndex].explanation}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {showSummary && score && (
          <section className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-heading font-bold text-white">Quiz Complete!</h2>
              <div className="text-6xl font-bold text-accent-400">
                {score.correct}/{score.total}
              </div>
              <p className="text-2xl text-primary-200 font-body">{score.percentage}% Correct</p>
              <p className="text-xl text-primary-300 font-body max-w-2xl mx-auto">
                {getScoreMessage(score.percentage)}
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-primary-700 rounded-xl p-8 space-y-6">
              <h3 className="text-2xl font-heading font-bold text-white">Module Summary</h3>
              <ul className="space-y-3 text-primary-200 font-body text-lg">
                <li>• Completed {currentModule.title}</li>
                <li>• Mastered key concepts in {currentModule.estimatedTime}</li>
                <li>• Ready to build on this knowledge</li>
              </ul>

              {moduleIndex < curriculum.modules.length - 1 && (
                <div className="pt-4 border-t border-primary-700">
                  <p className="text-primary-300 font-body mb-4">
                    <span className="font-semibold text-accent-400">Next up:</span>{' '}
                    {curriculum.modules[moduleIndex + 1].title}
                  </p>
                </div>
              )}

              <button
                onClick={goToNextModule}
                className="w-full px-8 py-4 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-all duration-200 shadow-lg hover:shadow-xl font-body text-lg"
              >
                {moduleIndex < curriculum.modules.length - 1 ? 'Next Module →' : 'Complete Curriculum →'}
              </button>
            </div>
          </section>
        )}
      </main>

      {showPaywall && (
        <Paywall
          nextModuleTitle={
            moduleIndex < curriculum.modules.length - 1
              ? curriculum.modules[moduleIndex + 1].title
              : null
          }
          onClose={() => {
            setShowPaywall(false);
            fetchCurriculum();
          }}
        />
      )}
    </div>
  );
}

export default Module;