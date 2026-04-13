import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/spark-cards.css';

function SparkCardSkeleton() {
  return (
    <div className="spark-card spark-card--skeleton" aria-hidden="true">
      <div className="skeleton-line skeleton-line--short" />
      <div className="skeleton-line skeleton-line--long" />
    </div>
  );
}

function SparkCard({ promptPhrasing, topic, onClick }) {
  return (
    <button
      className="spark-card"
      onClick={() => onClick(promptPhrasing)}
      title={`Start learning: ${topic}`}
      type="button"
    >
      <span className="spark-card__prompt">{promptPhrasing}</span>
      <span className="spark-card__arrow" aria-hidden="true">→</span>
    </button>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [sparkTopics, setSparkTopics] = useState([]);
  const [sparkLoading, setSparkLoading] = useState(true);
  const [sparkError, setSparkError] = useState(false);

  const fetchSparkTopics = useCallback(async () => {
    setSparkLoading(true);
    setSparkError(false);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/topics/spark`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      if (data.success && Array.isArray(data.topics) && data.topics.length > 0) {
        setSparkTopics(data.topics);
      } else {
        throw new Error('Empty topics response');
      }
    } catch (err) {
      console.error('[Home] Failed to load spark topics:', err.message);
      setSparkError(true);
      setSparkTopics([
        { topic: 'Machine Learning', promptPhrasing: 'Teach me the basics of Machine Learning' },
        { topic: 'Quantum Computing', promptPhrasing: 'How does Quantum Computing work?' },
        { topic: 'Blockchain', promptPhrasing: 'Break down Blockchain Technology for me' },
        { topic: 'Neuroscience', promptPhrasing: 'Help me understand Neuroscience' },
        { topic: 'Climate Science', promptPhrasing: "Give me a beginner's guide to Climate Science" },
        { topic: 'Cryptography', promptPhrasing: "Explain Cryptography like I'm new to it" },
      ]);
    } finally {
      setSparkLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSparkTopics();
  }, [fetchSparkTopics]);

  function handleSparkClick(promptPhrasing) {
    navigate('/learn', { state: { prefillPrompt: promptPhrasing } });
  }

  return (
    <div className="home-page">

      <section className="spark-section">
        <div className="spark-section__header">
          <h2 className="spark-section__title">What do you want to learn today?</h2>
          {!sparkLoading && (
            <button
              className="spark-section__refresh"
              onClick={fetchSparkTopics}
              title="Refresh suggestions"
              type="button"
            >
              ↻ Refresh
            </button>
          )}
        </div>

        {sparkError && (
          <p className="spark-section__notice">
            Showing popular topics — personalized suggestions will load shortly.
          </p>
        )}

        <div className="spark-cards-grid">
          {sparkLoading
            ? Array.from({ length: 6 }).map((_, i) => <SparkCardSkeleton key={i} />)
            : sparkTopics.map((t, i) => (
                <SparkCard
                  key={`${t.topic}-${i}`}
                  topic={t.topic}
                  promptPhrasing={t.promptPhrasing}
                  onClick={handleSparkClick}
                />
              ))}
        </div>
      </section>

    </div>
  );
}
