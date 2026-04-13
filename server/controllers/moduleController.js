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

// Generate lesson content for a module (with streaming)
exports.generateLesson = async (req, res) => {
  try {
    const { curriculumId, moduleIndex } = req.params;
    const userId = req.user._id;
    const Curriculum = require('../models/Curriculum');

    const curriculum = await Curriculum.findOne({ _id: curriculumId, userId });
    
    if (!curriculum) {
      return res.status(404).json({ error: 'Curriculum not found' });
    }

    const module = curriculum.modules[moduleIndex];
    
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Check if lesson content already exists (return cached content)
    if (module.content && module.content.length > 100) {
      console.log('✅ Returning existing lesson content');
      return res.json({ content: module.content, cached: true });
    }

    console.log('🎓 Generating lesson for module:', module.title);

    // Determine word count based on curriculum duration
    const duration = curriculum.duration;
    let wordCountInstruction = '';
    
    if (duration === '10min') {
      wordCountInstruction = 'Write a concise, engaging lesson of 200-300 words.';
    } else if (duration === '30min') {
      wordCountInstruction = 'Write a clear, engaging lesson of 400-500 words.';
    } else if (duration === '2hrs') {
      wordCountInstruction = 'Write a detailed, engaging lesson of 600-800 words.';
    } else if (duration === '10hrs') {
      wordCountInstruction = 'Write a comprehensive, engaging lesson of 1000-1200 words.';
    } else if (duration === '20hrs') {
      wordCountInstruction = 'Write an in-depth, engaging lesson of 1400-1600 words.';
    } else if (duration === '30hrs') {
      wordCountInstruction = 'Write a thorough, engaging lesson of 1800-2000 words.';
    } else {
      wordCountInstruction = 'Write a clear, engaging lesson of 400-500 words.';
    }

    // Set up streaming headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullContent = '';

    // Generate lesson content with Claude streaming
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: `IMPORTANT: You must format this lesson using markdown. Every section title MUST start with ## on its own line. Never write a section title as plain text. Always leave a blank line before and after each ## heading.

Now write a lesson about:

Title: ${module.title}
Description: ${module.description}
Estimated Time: ${module.estimatedTime}

${wordCountInstruction}

Formatting requirements:
- Use ## for all section headings (on their own line)
- Use ### for sub-headings
- Use ** around bold terms
- Use - for bullet points
- Leave a blank line before and after every heading

Example:
## What is Psychology?

Psychology is the **scientific study** of mind and behaviour.

### Key Areas
- Cognitive psychology
- Behavioural psychology

Create engaging, educational content that:
- Explains concepts clearly with examples
- Breaks content into clear concept blocks
- Include practical examples and analogies
- Make it conversational and engaging`
      }]
    });

    // Stream text chunks to frontend
    stream.on('text', (text) => {
      fullContent += text;
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    });

    // On completion, save to database and send done signal
    stream.on('end', async () => {
      try {
        console.log('📝 LESSON CONTENT SAMPLE:', fullContent.substring(0, 500));
        module.content = fullContent;
        await curriculum.save();
        console.log('✅ Lesson content generated and saved');
        res.write('data: [DONE]\n\n');
        res.end();
      } catch (saveError) {
        console.error('❌ Error saving lesson:', saveError);
        res.write(`data: ${JSON.stringify({ error: 'Failed to save lesson' })}\n\n`);
        res.end();
      }
    });

    stream.on('error', (error) => {
      console.error('❌ Streaming error:', error);
      res.write(`data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`);
      res.end();
    });

  } catch (error) {
    console.error('❌ Error generating lesson:', error);
    res.status(500).json({ 
      error: 'Failed to generate lesson',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Generate quiz questions for a module
exports.generateQuiz = async (req, res) => {
  try {
    const { curriculumId, moduleIndex } = req.params;
    const userId = req.user._id;
    const Curriculum = require('../models/Curriculum');

    const curriculum = await Curriculum.findOne({ _id: curriculumId, userId });
    
    if (!curriculum) {
      return res.status(404).json({ error: 'Curriculum not found' });
    }

    const module = curriculum.modules[moduleIndex];
    
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Check if quiz already exists
    if (module.questions && module.questions.length > 0) {
      console.log('✅ Returning existing quiz questions');
      return res.json({ questions: module.questions });
    }

    console.log('📝 Generating quiz for module:', module.title);

    // Generate quiz with Claude
    const message = await callAnthropicWithRetry({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Create 3-5 quiz questions for this module:

Title: ${module.title}
Description: ${module.description}
Content: ${module.content || 'No content yet'}

Create a JSON array of quiz questions with this format:
[
  {
    "type": "multiple-choice",
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option B",
    "explanation": "Brief explanation of why this is correct"
  }
]

Rules:
- Create 3-5 multiple choice questions
- Questions should test understanding, not just memorization
- Options should be plausible but only one correct
- Explanations should be brief and educational
- Vary difficulty from easy to moderate

Respond ONLY with the JSON array, no other text.`
      }]
    });

    const questionsData = JSON.parse(message.content[0].text);

    // Save questions to database
    module.questions = questionsData;
    await curriculum.save();

    console.log('✅ Quiz questions generated and saved');

    res.json({ questions: questionsData });
  } catch (error) {
    console.error('❌ Error generating quiz:', error);
    res.status(500).json({ 
      error: 'Failed to generate quiz',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Submit quiz and save score
exports.submitQuiz = async (req, res) => {
  try {
    const { curriculumId, moduleIndex } = req.params;
    const { score, totalQuestions } = req.body;
    const userId = req.user._id;
    const Curriculum = require('../models/Curriculum');

    if (score === undefined || totalQuestions === undefined) {
      return res.status(400).json({ error: 'Score and totalQuestions are required' });
    }

    const curriculum = await Curriculum.findOne({ _id: curriculumId, userId });
    
    if (!curriculum) {
      return res.status(404).json({ error: 'Curriculum not found' });
    }

    const module = curriculum.modules[moduleIndex];
    
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Calculate percentage
    const percentage = Math.round((score / totalQuestions) * 100);

    // Update module with quiz results
    module.score = percentage;
    module.completed = true;

    // Update curriculum's currentModuleIndex if this is the current module
    if (curriculum.currentModuleIndex === parseInt(moduleIndex)) {
      curriculum.currentModuleIndex = parseInt(moduleIndex) + 1;
    }

    await curriculum.save();

    console.log(`✅ Quiz submitted for module ${moduleIndex}: ${percentage}%`);

    res.json({ 
      message: 'Quiz submitted successfully',
      score: percentage,
      moduleCompleted: true
    });
  } catch (error) {
    console.error('❌ Error submitting quiz:', error);
    res.status(500).json({ 
      error: 'Failed to submit quiz',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Explain a concept differently
exports.explainDifferently = async (req, res) => {
  try {
    const { curriculumId, moduleIndex } = req.params;
    const { conceptText } = req.body;
    const userId = req.user._id;
    const Curriculum = require('../models/Curriculum');

    if (!conceptText) {
      return res.status(400).json({ error: 'Concept text is required' });
    }

    const curriculum = await Curriculum.findOne({ _id: curriculumId, userId });
    
    if (!curriculum) {
      return res.status(404).json({ error: 'Curriculum not found' });
    }

    const module = curriculum.modules[moduleIndex];
    
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    console.log('🔄 Generating alternative explanation');

    // Generate alternative explanation with Claude
    const message = await callAnthropicWithRetry({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `The user is learning about: ${module.title}

They want a different explanation of this concept:
${conceptText}

Provide an alternative explanation that:
- Uses a completely different approach or analogy
- Is clear and engaging
- Includes a practical example
- Uses markdown formatting
- Is concise but thorough

Respond with just the alternative explanation in markdown format.`
      }]
    });

    const alternativeExplanation = message.content[0].text;

    console.log('✅ Alternative explanation generated');

    res.json({ explanation: alternativeExplanation });
  } catch (error) {
    console.error('❌ Error generating alternative explanation:', error);
    res.status(500).json({ 
      error: 'Failed to generate explanation',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Track user learning time
exports.trackTime = async (req, res) => {
  try {
    const { minutes } = req.body;
    const userId = req.user._id;
    const User = require('../models/User');

    if (!minutes || minutes <= 0) {
      return res.status(400).json({ error: 'Valid minutes value required' });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update free minutes used and total learning time
    user.freeMinutesUsed = (user.freeMinutesUsed || 0) + minutes;
    user.totalLearningTime = (user.totalLearningTime || 0) + minutes;
    
    await user.save();

    console.log(`⏱️ Time tracked: ${minutes} minutes`);

    res.json({ 
      freeMinutesUsed: user.freeMinutesUsed,
      totalLearningTime: user.totalLearningTime,
      freeMinutesRemaining: Math.max(0, 30 - user.freeMinutesUsed)
    });
  } catch (error) {
    console.error('❌ Error tracking time:', error);
    res.status(500).json({ 
      error: 'Failed to track time',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
