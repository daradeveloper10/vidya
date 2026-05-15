function TimeSelection({ onSelect }) {
  const timeOptions = [
    
    { value: '10min', label: '10 minutes', description: 'The mental model explained' },
    { value: '30min', label: '30 minutes', description: 'Foundation with a real example' },
    { value: '2hrs', label: '2 hours', description: 'Solid working knowledge' },
    { value: '5hrs', label: '5 hours', description: 'Practical competency' },
    { value: '10hrs', label: '10 hours', description: 'Real competency you can use' },
    { value: '20hrs', label: '20 hours', description: 'Deep proficiency' },
    { value: '30hrs', label: '30 hours', description: 'Near-expertise level' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-heading font-bold text-white">
          How deep do you want to go?
        </h2>
        <p className="text-xl text-primary-200 font-body">
          Choose your time commitment and we'll tailor the curriculum
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {timeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onSelect(option.value)}
            className="p-6 bg-white/5 backdrop-blur-sm border-2 border-primary-700 rounded-xl hover:bg-white/10 hover:border-accent-500 transition-all duration-200 text-left group space-y-2"
          >
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-heading font-bold text-white group-hover:text-accent-400 transition-colors">
                {option.label}
              </span>
            </div>
            <p className="text-primary-200 group-hover:text-primary-100 transition-colors font-body text-sm">
              {option.description}
            </p>
          </button>
        ))}
      </div>

      <div className="text-center">
        <p className="text-primary-300 font-body text-sm">
          Don't worry — you can always come back and learn more later
        </p>
      </div>
    </div>
  );
}

export default TimeSelection;
