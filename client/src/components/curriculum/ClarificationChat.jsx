import { useState } from 'react';

function ClarificationChat({ questions, options, onComplete }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleOptionClick = (option) => {
    const newAnswers = [...answers, option];
    setAnswers(newAnswers);
    setShowCustomInput(false);

    // Move to next question or complete
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // All questions answered
      onComplete(newAnswers, questions);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (currentAnswer.trim()) {
      const newAnswers = [...answers, currentAnswer];
      setAnswers(newAnswers);
      setCurrentAnswer('');
      setShowCustomInput(false);

      // Move to next question or complete
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // All questions answered
        onComplete(newAnswers, questions);
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Previous Q&A */}
      {answers.map((answer, index) => (
        <div key={index} className="space-y-3">
          {/* Claude's Question */}
          <div className="flex justify-start">
            <div className="max-w-md bg-white/10 backdrop-blur-sm border border-primary-700 rounded-2xl rounded-tl-sm px-6 py-4">
              <p className="text-primary-100 font-body">{questions[index]}</p>
            </div>
          </div>
          {/* User's Answer */}
          <div className="flex justify-end">
            <div className="max-w-md bg-accent-500/20 border border-accent-500 rounded-2xl rounded-tr-sm px-6 py-4">
              <p className="text-white font-body">{answer}</p>
            </div>
          </div>
        </div>
      ))}

      {/* Current Question */}
      {currentQuestionIndex < questions.length && (
        <div className="space-y-4">
          <div className="flex justify-start">
            <div className="max-w-md bg-white/10 backdrop-blur-sm border border-primary-700 rounded-2xl rounded-tl-sm px-6 py-4">
              <p className="text-primary-100 font-body">{questions[currentQuestionIndex]}</p>
            </div>
          </div>

          {/* Option Pills */}
          {!showCustomInput && options && options[currentQuestionIndex] && (
            <div className="space-y-3">
              {options[currentQuestionIndex].map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleOptionClick(option)}
                  className="w-full px-6 py-3 bg-white/5 backdrop-blur-sm border-2 border-primary-700 rounded-full text-primary-100 hover:bg-accent-500 hover:border-accent-500 hover:text-white transition-all duration-200 font-body text-[0.95rem]"
                  style={{ borderRadius: '2rem' }}
                >
                  {option}
                </button>
              ))}
              
              {/* "Type your own" link */}
              <div className="text-center pt-2">
                <button
                  onClick={() => setShowCustomInput(true)}
                  className="text-primary-400 hover:text-primary-200 text-sm font-body transition-colors"
                >
                  None of these? Type your own answer ↓
                </button>
              </div>
            </div>
          )}

          {/* Custom Answer Input (shown when user clicks "type your own") */}
          {showCustomInput && (
            <form onSubmit={handleCustomSubmit} className="space-y-3">
              <input
                type="text"
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Type your answer..."
                className="w-full px-6 py-4 rounded-lg bg-white/10 backdrop-blur-sm border-2 border-primary-700 text-white placeholder-primary-300 focus:outline-none focus:border-accent-500 transition-colors font-body"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCustomInput(false)}
                  className="px-6 py-3 bg-white/5 text-primary-200 font-semibold rounded-lg hover:bg-white/10 transition-all duration-200"
                >
                  ← Back to options
                </button>
                <button
                  type="submit"
                  className="flex-1 px-8 py-3 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Continue →
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default ClarificationChat;
