const axios = require('axios');
const cheerio = require('cheerio');

async function fetchClassCentralTopics() {
  // Hardcoded curated list of educational topics from major online learning platforms
  const curatedTopics = [
    'Machine Learning', 'Data Science', 'Python Programming', 'Web Development',
    'Artificial Intelligence', 'Cloud Computing', 'Cybersecurity', 'Digital Marketing',
    'Project Management', 'Business Analytics', 'Financial Analysis', 'Graphic Design',
    'UX Design', 'Mobile App Development', 'Blockchain Technology', 'Quantum Computing',
    'Statistics', 'Calculus', 'Linear Algebra', 'Discrete Mathematics',
    'Computer Science', 'Software Engineering', 'Database Management', 'DevOps',
    'React Development', 'Node.js', 'Java Programming', 'C++ Programming',
    'Game Development', 'Unity', 'Unreal Engine', '3D Modeling',
    'Photography', 'Video Editing', 'Music Production', 'Creative Writing',
    'Public Speaking', 'Leadership', 'Negotiation', 'Time Management',
    'Economics', 'Psychology', 'Sociology', 'Philosophy',
    'History', 'Political Science', 'International Relations', 'Law',
    'Biology', 'Chemistry', 'Physics', 'Astronomy',
    'Environmental Science', 'Climate Change', 'Renewable Energy', 'Sustainability',
    'Nutrition', 'Fitness', 'Yoga', 'Meditation',
    'Spanish', 'French', 'German', 'Mandarin Chinese',
    'Japanese', 'Arabic', 'Italian', 'Portuguese',
    'Accounting', 'Finance', 'Investing', 'Cryptocurrency',
    'Excel', 'SQL', 'Tableau', 'Power BI',
    'AWS', 'Azure', 'Google Cloud', 'Docker',
    'Kubernetes', 'Git', 'Linux', 'Networking',
    'Ethical Hacking', 'Penetration Testing', 'Network Security', 'Information Security',
    'Product Management', 'Agile', 'Scrum', 'Six Sigma',
    'Supply Chain Management', 'Operations Management', 'Human Resources', 'Sales',
    'Content Marketing', 'SEO', 'Social Media Marketing', 'Email Marketing',
    'Copywriting', 'Brand Strategy', 'Market Research', 'Consumer Behavior',
    'Architecture', 'Interior Design', 'Fashion Design', 'Industrial Design',
    'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Chemical Engineering',
    'Robotics', 'IoT', 'Embedded Systems', 'Signal Processing',
    'Natural Language Processing', 'Computer Vision', 'Deep Learning', 'Neural Networks',
    'Reinforcement Learning', 'Data Visualization', 'Big Data', 'Data Engineering',
    'Microeconomics', 'Macroeconomics', 'Econometrics', 'Game Theory',
    'Cognitive Science', 'Neuroscience', 'Behavioral Economics', 'Social Psychology',
    'World History', 'Ancient Civilizations', 'Medieval History', 'Modern History',
    'Art History', 'Music Theory', 'Film Studies', 'Literature',
    'Organic Chemistry', 'Biochemistry', 'Molecular Biology', 'Genetics',
    'Microbiology', 'Immunology', 'Pharmacology', 'Anatomy',
    'Astrophysics', 'Cosmology', 'Particle Physics', 'Thermodynamics',
    'Quantum Mechanics', 'Relativity', 'Electromagnetism', 'Optics'
  ];

  console.log(`[ClassCentral] Using ${curatedTopics.length} curated topics`);
  return curatedTopics;
}

async function filterAndCleanTopics(rawTopics) {
  // Topics are already curated and clean, just convert to proper format
  const results = rawTopics.map((topic) => ({
    topic: topic,
    promptPhrasing: topic,
    source: 'curated',
  }));

  console.log(`[Curated] Using all ${results.length} topics (no AI filter needed)`);
  return results;
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
