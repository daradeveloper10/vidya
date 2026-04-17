require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const LearningPath = require('../models/LearningPath');

const paths = [
  {
    slug: 'founder-stack',
    title: 'The Founder Stack',
    description: 'Everything you need to build and scale a startup from zero to traction. This path covers the essential disciplines every founder must master — from validating your idea to raising capital and leading a team.',
    goal: 'By the end of this path, you will be able to validate a business idea, build an MVP, pitch investors, and lead a high-performing team.',
    courses: [
      { title: 'Product-Market Fit', topic: 'Product-Market Fit', description: 'Learn how to validate your idea and find the right market before building.', estimatedTime: '2hrs', order: 0 },
      { title: 'Fundraising Fundamentals', topic: 'Startup Fundraising', description: 'Understand how venture capital works, how to pitch, and how to close a round.', estimatedTime: '2hrs', order: 1 },
      { title: 'Building a Team', topic: 'Startup Team Building', description: 'Learn how to hire, motivate, and retain the right people for your startup.', estimatedTime: '2hrs', order: 2 },
      { title: 'Growth Marketing', topic: 'Startup Growth Marketing', description: 'Master the fundamentals of growth — acquisition, retention, and virality.', estimatedTime: '2hrs', order: 3 },
      { title: 'Financial Modelling for Startups', topic: 'Startup Financial Modelling', description: 'Build financial models that tell the story of your business to investors.', estimatedTime: '2hrs', order: 4 },
    ]
  },
  {
    slug: 'ai-literacy',
    title: 'The AI Literacy Path',
    description: 'A structured journey from AI curious to AI confident. Understand how modern AI systems work, how to use them effectively, and how they will shape the future of work and society.',
    goal: 'By the end of this path, you will understand how AI and machine learning work, be able to use AI tools effectively, and think critically about AI ethics and impact.',
    courses: [
      { title: 'Machine Learning Basics', topic: 'Machine Learning Fundamentals', description: 'Understand how machines learn from data without being explicitly programmed.', estimatedTime: '2hrs', order: 0 },
      { title: 'Neural Networks Explained', topic: 'Neural Networks', description: 'Demystify deep learning and understand how neural networks are structured.', estimatedTime: '2hrs', order: 1 },
      { title: 'AI Ethics and Society', topic: 'AI Ethics', description: 'Explore the moral and societal implications of artificial intelligence.', estimatedTime: '2hrs', order: 2 },
      { title: 'Large Language Models', topic: 'Large Language Models', description: 'Understand how GPT, Claude and other LLMs work and how to use them well.', estimatedTime: '2hrs', order: 3 },
      { title: 'AI in the Workplace', topic: 'AI Productivity and Work', description: 'Learn how to leverage AI tools to dramatically increase your productivity.', estimatedTime: '2hrs', order: 4 },
    ]
  },
  {
    slug: 'investors-mind',
    title: "The Investor's Mind",
    description: 'A complete introduction to investing and wealth building. Learn how to think about money, markets, and risk like a professional investor — regardless of your starting capital.',
    goal: 'By the end of this path, you will understand how financial markets work, how to build a portfolio, manage risk, and develop the psychological discipline of a successful investor.',
    courses: [
      { title: 'Portfolio Theory', topic: 'Investment Portfolio Theory', description: 'Learn how to construct a diversified portfolio that balances risk and return.', estimatedTime: '2hrs', order: 0 },
      { title: 'Risk Management', topic: 'Investment Risk Management', description: 'Understand how to identify, measure, and manage financial risk.', estimatedTime: '2hrs', order: 1 },
      { title: 'Market Psychology', topic: 'Behavioural Finance and Market Psychology', description: 'Understand the emotional and cognitive biases that drive market behaviour.', estimatedTime: '2hrs', order: 2 },
      { title: 'Equity Analysis', topic: 'Stock and Equity Analysis', description: 'Learn how to research and evaluate individual stocks and companies.', estimatedTime: '2hrs', order: 3 },
      { title: 'Personal Finance Foundations', topic: 'Personal Finance', description: 'Master budgeting, saving, debt management, and building long-term wealth.', estimatedTime: '2hrs', order: 4 },
    ]
  }
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected');
  for (const path of paths) {
    await LearningPath.findOneAndUpdate(
      { slug: path.slug },
      path,
      { upsert: true, new: true }
    );
    console.log(`Upserted: ${path.title}`);
  }
  console.log('Seeding complete');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
