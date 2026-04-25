const axios = require('axios');
const cheerio = require('cheerio');

async function fetchClassCentralTopics() {
  // Curated list of 100 high-quality educational topics across diverse categories
  const curatedTopics = [
    // Business & Entrepreneurship
    { topic: 'Building a startup from scratch', promptPhrasing: 'Building a startup from scratch', category: 'Business' },
    { topic: 'Venture capital fundamentals', promptPhrasing: 'Venture capital fundamentals', category: 'Business' },
    { topic: 'Finding product-market fit', promptPhrasing: 'Finding product-market fit', category: 'Business' },
    { topic: 'How to negotiate anything', promptPhrasing: 'How to negotiate anything', category: 'Business' },
    { topic: 'Managing high-performing teams', promptPhrasing: 'Managing high-performing teams', category: 'Business' },
    { topic: 'Financial modelling for business', promptPhrasing: 'Financial modelling for business', category: 'Business' },
    { topic: 'Writing a compelling business plan', promptPhrasing: 'Writing a compelling business plan', category: 'Business' },
    { topic: 'Growth hacking for startups', promptPhrasing: 'Growth hacking for startups', category: 'Business' },
    { topic: 'Mergers and acquisitions explained', promptPhrasing: 'Mergers and acquisitions explained', category: 'Business' },
    { topic: 'The psychology of pricing', promptPhrasing: 'The psychology of pricing', category: 'Business' },
    { topic: 'How to raise funding', promptPhrasing: 'How to raise funding', category: 'Business' },
    { topic: 'Building a SaaS business', promptPhrasing: 'Building a SaaS business', category: 'Business' },
    { topic: 'Franchise business models explained', promptPhrasing: 'Franchise business models explained', category: 'Business' },

    // Finance & Investing
    { topic: 'How the stock market works', promptPhrasing: 'How the stock market works', category: 'Finance' },
    { topic: 'Personal finance and wealth building', promptPhrasing: 'Personal finance and wealth building', category: 'Finance' },
    { topic: 'Cryptocurrency and blockchain explained', promptPhrasing: 'Cryptocurrency and blockchain explained', category: 'Finance' },
    { topic: 'Reading financial statements', promptPhrasing: 'Reading financial statements', category: 'Finance' },
    { topic: 'Real estate investing basics', promptPhrasing: 'Real estate investing basics', category: 'Finance' },
    { topic: 'Options trading fundamentals', promptPhrasing: 'Options trading fundamentals', category: 'Finance' },
    { topic: 'How central banks work', promptPhrasing: 'How central banks work', category: 'Finance' },
    { topic: 'Index funds vs active investing', promptPhrasing: 'Index funds vs active investing', category: 'Finance' },
    { topic: 'Risk and portfolio management', promptPhrasing: 'Risk and portfolio management', category: 'Finance' },
    { topic: 'How hedge funds make money', promptPhrasing: 'How hedge funds make money', category: 'Finance' },
    { topic: 'Understanding inflation and deflation', promptPhrasing: 'Understanding inflation and deflation', category: 'Finance' },
    { topic: 'Investing in emerging markets', promptPhrasing: 'Investing in emerging markets', category: 'Finance' },
    { topic: 'The basics of tax planning', promptPhrasing: 'The basics of tax planning', category: 'Finance' },

    // Technology
    { topic: 'How artificial intelligence works', promptPhrasing: 'How artificial intelligence works', category: 'Technology' },
    { topic: 'Cybersecurity fundamentals', promptPhrasing: 'Cybersecurity fundamentals', category: 'Technology' },
    { topic: 'How the internet works', promptPhrasing: 'How the internet works', category: 'Technology' },
    { topic: 'Machine learning for beginners', promptPhrasing: 'Machine learning for beginners', category: 'Technology' },
    { topic: 'Cloud computing explained', promptPhrasing: 'Cloud computing explained', category: 'Technology' },
    { topic: 'How smartphones work', promptPhrasing: 'How smartphones work', category: 'Technology' },
    { topic: 'Quantum computing basics', promptPhrasing: 'Quantum computing basics', category: 'Technology' },
    { topic: 'Data science fundamentals', promptPhrasing: 'Data science fundamentals', category: 'Technology' },
    { topic: 'How algorithms shape your feed', promptPhrasing: 'How algorithms shape your feed', category: 'Technology' },
    { topic: 'Blockchain beyond cryptocurrency', promptPhrasing: 'Blockchain beyond cryptocurrency', category: 'Technology' },
    { topic: 'How GPS works', promptPhrasing: 'How GPS works', category: 'Technology' },
    { topic: 'The future of robotics', promptPhrasing: 'The future of robotics', category: 'Technology' },

    // Psychology & Human Behaviour
    { topic: 'The psychology of persuasion', promptPhrasing: 'The psychology of persuasion', category: 'Psychology' },
    { topic: 'Cognitive biases and decisions', promptPhrasing: 'Cognitive biases and decisions', category: 'Psychology' },
    { topic: 'Understanding human motivation', promptPhrasing: 'Understanding human motivation', category: 'Psychology' },
    { topic: 'The science of habit formation', promptPhrasing: 'The science of habit formation', category: 'Psychology' },
    { topic: 'Emotional intelligence at work', promptPhrasing: 'Emotional intelligence at work', category: 'Psychology' },
    { topic: 'The psychology of money', promptPhrasing: 'The psychology of money', category: 'Psychology' },
    { topic: 'How memory and learning work', promptPhrasing: 'How memory and learning work', category: 'Psychology' },
    { topic: 'Neuroscience of decision making', promptPhrasing: 'Neuroscience of decision making', category: 'Psychology' },
    { topic: 'The psychology of addiction', promptPhrasing: 'The psychology of addiction', category: 'Psychology' },
    { topic: 'How social media affects the brain', promptPhrasing: 'How social media affects the brain', category: 'Psychology' },

    // History & Society
    { topic: 'Why the Roman Empire fell', promptPhrasing: 'Why the Roman Empire fell', category: 'History' },
    { topic: 'The causes of World War 1', promptPhrasing: 'The causes of World War 1', category: 'History' },
    { topic: 'The Cold War explained', promptPhrasing: 'The Cold War explained', category: 'History' },
    { topic: 'The history of money', promptPhrasing: 'The history of money', category: 'History' },
    { topic: 'How modern democracy developed', promptPhrasing: 'How modern democracy developed', category: 'History' },
    { topic: 'The Industrial Revolution explained', promptPhrasing: 'The Industrial Revolution explained', category: 'History' },
    { topic: 'The history of artificial intelligence', promptPhrasing: 'The history of artificial intelligence', category: 'History' },
    { topic: 'How globalisation changed the world', promptPhrasing: 'How globalisation changed the world', category: 'History' },
    { topic: 'The history of the internet', promptPhrasing: 'The history of the internet', category: 'History' },
    { topic: 'The transatlantic slave trade', promptPhrasing: 'The transatlantic slave trade', category: 'History' },

    // Science & Health
    { topic: 'How the immune system works', promptPhrasing: 'How the immune system works', category: 'Science' },
    { topic: 'The science of nutrition', promptPhrasing: 'The science of nutrition', category: 'Science' },
    { topic: 'Understanding genetics and DNA', promptPhrasing: 'Understanding genetics and DNA', category: 'Science' },
    { topic: 'How vaccines work', promptPhrasing: 'How vaccines work', category: 'Science' },
    { topic: 'The science of sleep', promptPhrasing: 'The science of sleep', category: 'Science' },
    { topic: 'Climate change causes and effects', promptPhrasing: 'Climate change causes and effects', category: 'Science' },
    { topic: 'How drugs work in the body', promptPhrasing: 'How drugs work in the body', category: 'Science' },
    { topic: 'Quantum physics basics', promptPhrasing: 'Quantum physics basics', category: 'Science' },
    { topic: 'How the brain works', promptPhrasing: 'How the brain works', category: 'Science' },
    { topic: 'The science of exercise', promptPhrasing: 'The science of exercise', category: 'Science' },
    { topic: 'Understanding mental health disorders', promptPhrasing: 'Understanding mental health disorders', category: 'Science' },
    { topic: 'How evolution works', promptPhrasing: 'How evolution works', category: 'Science' },

    // Law & Politics
    { topic: 'How the Irish legal system works', promptPhrasing: 'How the Irish legal system works', category: 'Law' },
    { topic: 'Constitutional law fundamentals', promptPhrasing: 'Constitutional law fundamentals', category: 'Law' },
    { topic: 'How contracts work', promptPhrasing: 'How contracts work', category: 'Law' },
    { topic: 'Intellectual property for creators', promptPhrasing: 'Intellectual property for creators', category: 'Law' },
    { topic: 'How the EU works', promptPhrasing: 'How the EU works', category: 'Law' },
    { topic: 'Tax law basics', promptPhrasing: 'Tax law basics', category: 'Law' },
    { topic: 'Criminal law fundamentals', promptPhrasing: 'Criminal law fundamentals', category: 'Law' },
    { topic: 'How international law works', promptPhrasing: 'How international law works', category: 'Law' },
    { topic: 'Employment law essentials', promptPhrasing: 'Employment law essentials', category: 'Law' },
    { topic: 'How courts reach verdicts', promptPhrasing: 'How courts reach verdicts', category: 'Law' },

    // Communication & Leadership
    { topic: 'Public speaking fundamentals', promptPhrasing: 'Public speaking fundamentals', category: 'Communication' },
    { topic: 'Writing persuasively', promptPhrasing: 'Writing persuasively', category: 'Communication' },
    { topic: 'Storytelling for business', promptPhrasing: 'Storytelling for business', category: 'Communication' },
    { topic: 'Leadership styles explained', promptPhrasing: 'Leadership styles explained', category: 'Communication' },
    { topic: 'Running effective meetings', promptPhrasing: 'Running effective meetings', category: 'Communication' },
    { topic: 'Conflict resolution strategies', promptPhrasing: 'Conflict resolution strategies', category: 'Communication' },
    { topic: 'Giving and receiving feedback', promptPhrasing: 'Giving and receiving feedback', category: 'Communication' },
    { topic: 'Building your personal brand', promptPhrasing: 'Building your personal brand', category: 'Communication' },
    { topic: 'Cross-cultural communication', promptPhrasing: 'Cross-cultural communication', category: 'Communication' },
    { topic: 'Mentoring and coaching skills', promptPhrasing: 'Mentoring and coaching skills', category: 'Communication' },
    { topic: 'Negotiation tactics that work', promptPhrasing: 'Negotiation tactics that work', category: 'Communication' },
    { topic: 'How to influence without authority', promptPhrasing: 'How to influence without authority', category: 'Communication' },

    // Philosophy & Critical Thinking
    { topic: 'Introduction to philosophy', promptPhrasing: 'Introduction to philosophy', category: 'Philosophy' },
    { topic: 'Logic and critical thinking', promptPhrasing: 'Logic and critical thinking', category: 'Philosophy' },
    { topic: 'Ethics in the modern world', promptPhrasing: 'Ethics in the modern world', category: 'Philosophy' },
    { topic: 'Stoicism and daily life', promptPhrasing: 'Stoicism and daily life', category: 'Philosophy' },
    { topic: 'The philosophy of mind', promptPhrasing: 'The philosophy of mind', category: 'Philosophy' },
    { topic: 'Free will vs determinism', promptPhrasing: 'Free will vs determinism', category: 'Philosophy' },
    { topic: 'Political philosophy explained', promptPhrasing: 'Political philosophy explained', category: 'Philosophy' },
    { topic: 'The history of ideas', promptPhrasing: 'The history of ideas', category: 'Philosophy' },
  ];

  console.log(`[ClassCentral] Using ${curatedTopics.length} curated topics`);
  return curatedTopics;
}

async function filterAndCleanTopics(rawTopics) {
  // Topics are already curated and clean with categories, just return them
  console.log(`[Curated] Using all ${rawTopics.length} topics (no AI filter needed)`);
  return rawTopics;
}

async function fetchTrendingEducationalTopics() {
  console.log('[ClassCentral] Starting topic fetch...');
  const raw = await fetchClassCentralTopics();
  console.log(`[ClassCentral] ${raw.length} raw items before AI filter`);

  if (raw.length === 0) {
    console.warn('[ClassCentral] No raw topics scraped — returning empty');
    return [];
  }

  const cleaned = await filterAndCleanTopics(raw);
  console.log(`[ClassCentral] ${cleaned.length} clean topics after AI filter`);
  return cleaned;
}

function getRandomPrompt(topic) {
  return topic;
}

module.exports = { fetchTrendingEducationalTopics, getRandomPrompt };
