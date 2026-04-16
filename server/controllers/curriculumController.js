const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function callAnthropicWithRetry(params, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await anthropic.messages.create(params);
    } catch (error) {
      if (error.status === 529 && attempt < maxRetries) {
        console.log(`⏳ Anthropic overloaded, retrying in ${attempt * 2}s (attempt ${attempt}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
      } else {
        throw error;
      }
    }
  }
}

// Analyse user's learning topic input for clarity
exports.analyse = async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic || topic.trim().length === 0) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    console.log('🔍 Analysing topic:', topic);

    const message = await callAnthropicWithRetry({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are an AI learning assistant analyzing a user's learning request. Your job is to determine if their request is clear enough to create a curriculum, or if you need clarification.

User's request: "${topic}"

Analyze this request and respond with a JSON object:
{
  "clarity": "clear" | "partial" | "ambiguous",
  "questions": [],
  "options": []
}

Rules:
- "clear": The topic is specific enough. No questions needed. Return empty questions and options arrays.
- "partial": The topic needs ONE clarifying question. Ask about scope, level, or specific focus.
- "ambiguous": The topic needs TWO clarifying questions maximum. Ask about what they want to learn and their background.

Your questions should be:
- Friendly and conversational
- Specific to their topic
- Help narrow down what curriculum to create
- Never more than 2 questions total

For each question, provide 3-4 short, clear answer options in the options array.
Each set of options should be a sub-array matching the question at the same index.

Examples:
- "machine learning" → partial → 
  {
    "clarity": "partial",
    "questions": ["Are you interested in the theory behind ML, or practical applications?"],
    "options": [["Theory and mathematics", "Practical coding applications", "Both theory and practice", "General overview"]]
  }
- "learn stuff" → ambiguous → 
  {
    "clarity": "ambiguous",
    "questions": ["What subject or skill are you interested in?", "What's your goal with this learning?"],
    "options": [["Technology/Programming", "Business/Finance", "Creative skills", "Science/Math"], ["Career change", "Hobby/Personal interest", "Academic study", "General knowledge"]]
  }
- "teach me React hooks from scratch" → clear → 
  {
    "clarity": "clear",
    "questions": [],
    "options": []
  }

Respond ONLY with the JSON object, no other text.`
      }]
    });

    const responseText = message.content[0].text;
    console.log('📝 Claude response:', responseText);

    // Parse Claude's JSON response
    const analysis = JSON.parse(responseText);

    console.log('✅ Analysis complete:', analysis);

    res.json(analysis);
  } catch (error) {
    console.error('❌ Error analysing topic:', error);
    res.status(500).json({ 
      error: 'Failed to analyse topic',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all curricula for logged-in user
exports.getUserCurricula = async (req, res) => {
  try {
    const userId = req.user._id;
    const Curriculum = require('../models/Curriculum');

    const curricula = await Curriculum.find({ userId })
      .sort({ updatedAt: -1 })
      .select('-modules.content -modules.questions'); // Exclude heavy fields for list view

    res.json(curricula);
  } catch (error) {
    console.error('❌ Error fetching user curricula:', error);
    res.status(500).json({ 
      error: 'Failed to fetch curricula',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single curriculum by ID
exports.getCurriculumById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const Curriculum = require('../models/Curriculum');

    const curriculum = await Curriculum.findOne({ _id: id, userId });

    if (!curriculum) {
      return res.status(404).json({ error: 'Curriculum not found' });
    }

    res.json(curriculum);
  } catch (error) {
    console.error('❌ Error fetching curriculum:', error);
    res.status(500).json({ 
      error: 'Failed to fetch curriculum',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Generate further learning recommendations
exports.getFurtherLearning = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const Curriculum = require('../models/Curriculum');

    const curriculum = await Curriculum.findOne({ _id: id, userId });
    
    if (!curriculum) {
      return res.status(404).json({ error: 'Curriculum not found' });
    }

    console.log('🎓 Generating further learning recommendations for:', curriculum.topic);

    const message = await callAnthropicWithRetry({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `The user just completed a learning curriculum on: "${curriculum.topic}"

Generate 5 contextual recommendations for what they should learn next. These should:
- Build on what they just learned
- Be natural progressions or complementary topics
- Range from immediate next steps to broader related areas
- Be specific and actionable

Return a JSON array with this format:
[
  {
    "topic": "Specific topic name",
    "reason": "One compelling sentence on why this matters",
    "prefilledPrompt": "A natural prompt they could use to start learning this"
  }
]

Make the recommendations feel personal and encouraging. Respond ONLY with the JSON array.`
      }]
    });

    const recommendations = JSON.parse(message.content[0].text);

    console.log('✅ Further learning recommendations generated');

    res.json({ recommendations });
  } catch (error) {
    console.error('❌ Error generating further learning:', error);
    res.status(500).json({ 
      error: 'Failed to generate recommendations',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Mark curriculum as complete
exports.completeCurriculum = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const Curriculum = require('../models/Curriculum');

    const curriculum = await Curriculum.findOne({ _id: id, userId });
    
    if (!curriculum) {
      return res.status(404).json({ error: 'Curriculum not found' });
    }

    // Calculate stats from modules
    const completedModules = curriculum.modules.filter(m => m.completed).length;
    const scores = curriculum.modules
      .filter(m => m.score !== undefined && m.score !== null)
      .map(m => m.score);
    const averageQuizScore = scores.length > 0 
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    curriculum.completed = true;
    curriculum.completedAt = new Date();
    curriculum.stats = {
      completedModules,
      averageQuizScore
    };
    
    await curriculum.save();

    console.log('✅ Curriculum marked as complete:', id);
    console.log(`   Stats: ${completedModules} modules, ${averageQuizScore}% avg score`);

    res.json({ message: 'Curriculum completed', curriculum });
  } catch (error) {
    console.error('❌ Error completing curriculum:', error);
    res.status(500).json({ 
      error: 'Failed to complete curriculum',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete curriculum by ID
exports.deleteCurriculum = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const Curriculum = require('../models/Curriculum');

    const curriculum = await Curriculum.findOneAndDelete({ _id: id, userId });

    if (!curriculum) {
      return res.status(404).json({ error: 'Curriculum not found' });
    }

    console.log('🗑️ Curriculum deleted:', id);
    res.json({ message: 'Curriculum deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting curriculum:', error);
    res.status(500).json({ 
      error: 'Failed to delete curriculum',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Generate curriculum
exports.generate = async (req, res) => {
  try {
    const { topic, duration, clarificationAnswers } = req.body;
    const userId = req.user._id;

    if (!topic || !duration) {
      return res.status(400).json({ error: 'Topic and duration are required' });
    }

    const Curriculum = require('../models/Curriculum');

    // Check if curriculum already exists for this user, topic, and duration
    const existingCurriculum = await Curriculum.findOne({
      userId,
      topic,
      duration
    });

    if (existingCurriculum) {
      console.log('✅ Returning existing curriculum:', existingCurriculum._id);
      return res.json({
        curriculumId: existingCurriculum._id,
        topic: existingCurriculum.topic,
        duration: existingCurriculum.duration,
        moduleCount: existingCurriculum.modules.length,
        existing: true
      });
    }

    console.log('🎓 Generating new curriculum for:', topic, duration);

    // Check for duplicate curriculum (same topic and duration)
    const existing = await Curriculum.findOne({
      userId: userId,
      topic: { $regex: new RegExp(`^${topic}$`, 'i') },
      duration: duration
    });

    if (existing) {
      console.log('✅ Found existing curriculum, returning cached version');
      return res.json({
        curriculumId: existing._id,
        topic: existing.topic,
        duration: existing.duration,
        moduleCount: existing.modules.length,
        cached: true
      });
    }

    // Build context for Claude
    let contextPrompt = `Create a comprehensive learning curriculum for: "${topic}"
Time commitment: ${duration}`;

    if (clarificationAnswers && clarificationAnswers.length > 0) {
      contextPrompt += `\n\nAdditional context from user:\n${clarificationAnswers.join('\n')}`;
    }

    const message = await callAnthropicWithRetry({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `${contextPrompt}

Create a structured learning curriculum as a JSON object with this exact format:
{
  "modules": [
    {
      "title": "Module title",
      "estimatedTime": "10 minutes",
      "description": "Brief description of what this module covers",
      "content": "Detailed lesson content in markdown format. Include explanations, examples, and key concepts."
    }
  ]
}

Rules:
- Generate a maximum of 8 modules regardless of the total hours. Each module should cover a broad topic area.
- Keep descriptions concise — maximum 2 sentences each.
- Keep lesson descriptions to 1 sentence each.
- Each module should build on previous ones
- Content should be clear, engaging, and educational
- Use markdown formatting in content (headers, lists, bold, etc.)
- Estimated time should be realistic for each module

Respond ONLY with the JSON object, no other text.`
      }]
    });

    const responseText = message.content[0].text;
    console.log('📝 Claude curriculum response received');

    // Strip markdown code fences if present
    const cleanJson = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    console.log('🧹 Cleaned JSON:', cleanJson.substring(0, 200) + '...');

    // Parse Claude's JSON response with error handling
    let curriculumData;
    try {
      curriculumData = JSON.parse(cleanJson);
    } catch (err) {
      console.error('❌ Curriculum generation error:', err.message);
      return res.status(500).json({ 
        message: 'Failed to generate curriculum. Please try again with a more specific topic.' 
      });
    }

    // Generate clean display title and subtitle
    console.log('🎨 Generating display title...');
    const titleMessage = await callAnthropicWithRetry({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Given this learning topic: "${topic}"
And duration: ${duration}

Generate a clean display title and subtitle in JSON format:
{
  "displayTitle": "Clean, concise title (max 4-5 words)",
  "subtitle": "Duration-based subtitle"
}

Rules for displayTitle:
- Remove "teach me", "I want to learn", "explain", "help me understand"
- Capitalize properly
- Keep concise (max 4-5 words)
- Examples:
  "teach me the basics of machine learning" → "Machine Learning Basics"
  "I want to learn negotiation from scratch" → "Negotiation Fundamentals"
  "explain quantum physics simply" → "Quantum Physics Simplified"

Rules for subtitle:
- 10min → "A quick 10-minute overview"
- 30min → "A 30-minute introduction"
- 2hrs → "A 2-hour deep dive"
- 10hrs → "A comprehensive 10-hour course"
- 20hrs → "An in-depth 20-hour programme"
- 30hrs → "A complete 30-hour mastery course"

Respond ONLY with the JSON object.`
      }]
    });

    const titleData = JSON.parse(titleMessage.content[0].text);
    console.log('✅ Display title generated:', titleData.displayTitle);

    // Create curriculum in database
    const curriculum = await Curriculum.create({
      userId,
      topic,
      displayTitle: titleData.displayTitle,
      subtitle: titleData.subtitle,
      duration,
      clarificationAnswers: clarificationAnswers || [],
      modules: curriculumData.modules
    });

    console.log('✅ Curriculum saved to database:', curriculum._id);

    res.json({
      curriculumId: curriculum._id,
      topic: curriculum.topic,
      duration: curriculum.duration,
      moduleCount: curriculum.modules.length
    });
  } catch (error) {
    console.error('❌ Curriculum generation error:', error.message);
    console.error('❌ Stack trace:', error.stack);
    console.error('❌ Full error object:', error);
    res.status(500).json({ 
      error: 'Failed to generate curriculum',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
