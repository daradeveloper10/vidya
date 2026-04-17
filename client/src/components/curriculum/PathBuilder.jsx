import { useState, useEffect } from 'react';
import api from '../../services/api';

const DURATION_OPTIONS = ['2hrs', '5hrs', '10hrs'];

function PathBuilder({ topic, duration, clarificationAnswers, onConfirm, onSkip }) {
  const [loading, setLoading] = useState(false);
  const [checkingRelated, setCheckingRelated] = useState(true);
  const [relatedPath, setRelatedPath] = useState(null);
  const [pathName, setPathName] = useState('');
  const [pathDescription, setPathDescription] = useState('');
  const [curricula, setCurricula] = useState([]);
  const [warning, setWarning] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [customDuration, setCustomDuration] = useState('2hrs');
  const [showAddForm, setShowAddForm] = useState(false);
  const [mergeChoice, setMergeChoice] = useState(null);

  function durationToHours(d) {
    if (d === '10min') return 0.17;
    if (d === '30min') return 0.5;
    if (d === '2hrs') return 2;
    if (d === '5hrs') return 5;
    if (d === '10hrs') return 10;
    return 2;
  }

  function calcTotal(list) {
    return list.reduce((sum, c) => sum + durationToHours(c.duration), 0);
  }

  useEffect(() => {
    checkRelated();
  }, []);

  const checkRelated = async () => {
    try {
      const response = await api.post('/api/user-paths/check-related', { topic });
      const related = response.data.relatedPath;
      setRelatedPath(related);
      if (!related) {
        fetchSuggestions();
      }
    } catch (err) {
      console.error('Error checking related paths:', err);
      fetchSuggestions();
    } finally {
      setCheckingRelated(false);
    }
  };

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/user-paths/generate-suggestions', {
        topic,
        duration,
        clarificationAnswers,
      });

      const { pathName, pathDescription, startingCurriculum, suggestions } = response.data;

      setPathName(pathName);
      setPathDescription(pathDescription);

      const allCurricula = [
        { ...startingCurriculum, title: topic, locked: true },
        ...suggestions.map(s => ({ ...s, selected: true })),
      ];

      setCurricula(allCurricula);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCurriculum = (index) => {
    if (curricula[index].locked) return;
    const updated = curricula.map((c, i) =>
      i === index ? { ...c, selected: !c.selected } : c
    );
    const selectedList = updated.filter(c => c.locked || c.selected);
    const total = calcTotal(selectedList);
    if (total > 10) {
      setWarning('Adding this would exceed the 10-hour maximum. Please remove another topic first.');
      return;
    }
    setWarning('');
    setCurricula(updated);
  };

  const addCustomTopic = () => {
    if (!customTopic.trim()) return;
    const newItem = {
      topic: customTopic.trim(),
      title: customTopic.trim(),
      description: '',
      duration: customDuration,
      order: curricula.length,
      selected: true,
    };
    const updated = [...curricula, newItem];
    const selectedList = updated.filter(c => c.locked || c.selected);
    const total = calcTotal(selectedList);
    if (total > 10) {
      setWarning(`Adding "${customTopic}" would bring total to ${total}hrs which exceeds the 10-hour maximum.`);
      return;
    }
    setWarning('');
    setCurricula(updated);
    setCustomTopic('');
    setShowAddForm(false);
  };

  const handleConfirm = () => {
    const selectedCurricula = curricula.filter(c => c.locked || c.selected);
    const total = calcTotal(selectedCurricula);
    if (total < 5) {
      setWarning('Your path must be at least 5 hours total. Please add more topics.');
      return;
    }
    if (total > 10) {
      setWarning('Your path exceeds the 10-hour maximum. Please remove some topics.');
      return;
    }
    onConfirm({
      pathName,
      pathDescription,
      curricula: selectedCurricula.map((c, i) => ({ ...c, order: i })),
      mergePathId: mergeChoice === 'merge' ? relatedPath?._id : null,
    });
  };

  const selectedList = curricula.filter(c => c.locked || c.selected);
  const currentTotal = calcTotal(selectedList);

  if (checkingRelated) {
    return (
      <div className="text-center space-y-4 py-12">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-accent-500"></div>
        <p className="text-primary-200 font-body">Checking your learning history...</p>
      </div>
    );
  }

  if (relatedPath && mergeChoice === null) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-heading font-bold text-white">We found a related path</h2>
          <p className="text-primary-200 font-body">
            You already have a learning path called <span className="text-accent-400 font-semibold">"{relatedPath.name}"</span> that covers related topics.
          </p>
          <p className="text-primary-300 font-body text-sm">{relatedPath.reason}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => {
              setMergeChoice('merge');
              setLoading(true);
              fetchSuggestions();
            }}
            className="p-6 bg-accent-500/10 border-2 border-accent-500/50 rounded-xl text-left space-y-2 hover:border-accent-500 transition-all"
          >
            <p className="text-accent-400 font-heading font-bold text-lg">Add to existing path</p>
            <p className="text-primary-300 font-body text-sm">Add "{topic}" to your "{relatedPath.name}" path</p>
          </button>
          <button
            type="button"
            onClick={() => {
              setMergeChoice('new');
              setLoading(true);
              fetchSuggestions();
            }}
            className="p-6 bg-white/5 border-2 border-primary-700 rounded-xl text-left space-y-2 hover:border-accent-500 transition-all"
          >
            <p className="text-white font-heading font-bold text-lg">Create a new path</p>
            <p className="text-primary-300 font-body text-sm">Start a fresh learning path for "{topic}"</p>
          </button>
        </div>
        <div className="text-center">
          <button
            type="button"
            onClick={onSkip}
            className="text-primary-400 hover:text-white font-body text-sm transition-colors"
          >
            Skip — just generate the curriculum without a path
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center space-y-4 py-12">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-accent-500"></div>
        <p className="text-primary-200 font-body">Building your learning path...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-heading font-bold text-white">Build Your Learning Path</h2>
        <p className="text-primary-200 font-body">
          We've suggested a path based on what you want to learn. Customise it below.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-primary-300 font-body text-sm uppercase tracking-wide">Path Name</label>
        <input
          type="text"
          value={pathName}
          onChange={(e) => setPathName(e.target.value)}
          className="w-full px-4 py-3 bg-white/10 border border-primary-700 rounded-lg text-white font-body focus:outline-none focus:border-accent-500 transition-colors"
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm font-body">
          <span className="text-primary-300">Total path duration</span>
          <span className={`font-semibold ${currentTotal > 10 ? 'text-red-400' : currentTotal >= 5 ? 'text-accent-400' : 'text-amber-400'}`}>
            {currentTotal}hrs / 10hrs max
          </span>
        </div>
        <div className="w-full bg-primary-800 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${currentTotal > 10 ? 'bg-red-500' : 'bg-accent-500'}`}
            style={{ width: `${Math.min(100, (currentTotal / 10) * 100)}%` }}
          />
        </div>
        {currentTotal < 5 && (
          <p className="text-amber-400 font-body text-sm">Add more topics to reach the 5-hour minimum</p>
        )}
      </div>

      {warning && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 font-body text-sm">{warning}</p>
        </div>
      )}

      <div className="space-y-3">
        {curricula.map((c, index) => {
          const isSelected = c.locked || c.selected;
          return (
            <div
              key={index}
              onClick={() => toggleCurriculum(index)}
              className={`p-4 rounded-xl border transition-all duration-200 ${
                c.locked
                  ? 'bg-accent-500/10 border-accent-500/50 cursor-default'
                  : isSelected
                  ? 'bg-white/10 border-accent-500 cursor-pointer'
                  : 'bg-white/5 border-primary-700 cursor-pointer opacity-60'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  c.locked ? 'bg-accent-500 text-white' :
                  isSelected ? 'bg-accent-500/30 text-accent-400 border border-accent-500' :
                  'bg-primary-800 text-primary-400'
                }`}>
                  {c.locked ? '★' : isSelected ? '✓' : index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-body font-semibold">{c.title || c.topic}</p>
                    {c.locked && (
                      <span className="px-2 py-0.5 bg-accent-500/20 text-accent-400 text-xs rounded-full font-body">Starting point</span>
                    )}
                  </div>
                  {c.description && (
                    <p className="text-primary-300 font-body text-sm mt-0.5">{c.description}</p>
                  )}
                </div>
                <span className="text-primary-400 font-body text-sm flex-shrink-0">{c.duration}</span>
              </div>
            </div>
          );
        })}
      </div>

      {!showAddForm ? (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="w-full p-4 border-2 border-dashed border-primary-700 rounded-xl text-primary-400 hover:border-accent-500 hover:text-accent-400 transition-all font-body"
        >
          + Add your own topic
        </button>
      ) : (
        <div className="p-4 bg-white/5 border border-primary-700 rounded-xl space-y-3">
          <input
            type="text"
            placeholder="Topic name"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 border border-primary-700 rounded-lg text-white font-body focus:outline-none focus:border-accent-500 transition-colors"
          />
          <div className="flex gap-2">
            {DURATION_OPTIONS.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => setCustomDuration(d)}
                className={`px-4 py-2 rounded-lg font-body text-sm transition-colors ${
                  customDuration === d
                    ? 'bg-accent-500 text-white'
                    : 'bg-white/10 text-primary-300 hover:bg-white/20'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={addCustomTopic}
              className="flex-1 px-4 py-2 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-colors font-body"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setCustomTopic(''); }}
              className="px-4 py-2 text-primary-400 hover:text-white transition-colors font-body"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={currentTotal < 5 || currentTotal > 10 || !pathName.trim()}
          className="flex-1 px-8 py-4 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-all duration-200 shadow-lg font-body text-lg disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Build Path ({currentTotal}hrs)
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="px-8 py-4 text-primary-300 hover:text-white transition-colors font-body"
        >
          Skip — just the curriculum
        </button>
      </div>
    </div>
  );
}

export default PathBuilder;