# Vidya — Learn Anything

An AI-powered self-learning platform that generates personalized curricula on any topic. Built with React, Node.js, MongoDB, and Claude AI.

## Features

- 🎓 **AI-Generated Curricula**: Claude creates custom learning paths tailored to your topic and time commitment
- 📚 **Adaptive Lessons**: Streaming lesson content with markdown formatting, tables, and examples
- 🎥 **Video Integration**: Automatically finds and embeds the best educational YouTube videos
- ✅ **Interactive Quizzes**: Test your knowledge with AI-generated multiple-choice questions
- 📊 **Knowledge Passport**: Track your learning journey across 30 subject categories
- ⏱️ **Freemium Model**: 30 minutes of free learning, then upgrade for unlimited access
- 🔄 **"Explain Differently"**: Get alternative explanations if concepts aren't clear

## Tech Stack

### Frontend
- **React 18** with Vite
- **React Router** for navigation
- **Tailwind CSS** with custom design system
- **ReactMarkdown** with GitHub Flavored Markdown support
- **Axios** for API calls

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **Passport.js** for Google OAuth authentication
- **Anthropic Claude API** for AI content generation
- **YouTube Data API v3** for video search and selection

### Fonts & Design
- **Playfair Display** (headings)
- **Outfit** (body text)
- Deep indigo + amber color palette

## Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account (or local MongoDB)
- Google Cloud Console project (for OAuth)
- Anthropic API key
- YouTube Data API key

## Environment Variables

### Server (.env in `/server`)

```env
# Anthropic Claude API
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# MongoDB
MONGODB_URI=your_mongodb_connection_string_here

# Session
SESSION_SECRET=your_random_session_secret_here

# YouTube API
YOUTUBE_API_KEY=your_youtube_api_key_here

# Client URL
CLIENT_URL=http://localhost:5173

# Server Port (optional)
PORT=3000
```

### Client
No environment variables needed for the client.

## Installation & Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd Vidya
```

### 2. Install dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Set up environment variables

Create a `.env` file in the `/server` directory with the variables listed above.

### 4. Get API Keys

#### Anthropic Claude API:
1. Go to https://console.anthropic.com/
2. Create an account and get your API key
3. Add to `ANTHROPIC_API_KEY` in `.env`

#### Google OAuth:
1. Go to https://console.cloud.google.com/
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/google/callback`
6. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env`

#### MongoDB:
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get your connection string
4. Add to `MONGODB_URI` in `.env`

#### YouTube Data API:
1. Go to https://console.cloud.google.com/
2. Enable YouTube Data API v3
3. Create an API key
4. Add to `YOUTUBE_API_KEY` in `.env`

### 5. Run the application

```bash
# Terminal 1: Start the backend server
cd server
npm start

# Terminal 2: Start the frontend dev server
cd client
npm run dev
```

The app will be available at:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000

## Usage

1. **Sign in** with your Google account
2. **Enter a topic** you want to learn (e.g., "Python programming", "Ancient Rome")
3. **Answer clarification questions** (if needed)
4. **Choose your time commitment** (10 min to 30 hours)
5. **Wait for AI generation** - Claude creates your personalized curriculum
6. **Start learning** - Read lessons, watch videos, take quizzes
7. **Track progress** - View your Knowledge Passport and completed curricula

## Project Structure

```
Vidya/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # React Context (Auth)
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service
│   │   └── App.jsx        # Main app component
│   └── package.json
│
├── server/                # Node.js backend
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Auth middleware
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   ├── services/         # External services (Claude, YouTube)
│   ├── index.js          # Server entry point
│   └── package.json
│
├── memory-bank/          # Project documentation
│   ├── progress.md       # Development progress
│   ├── activeContext.md  # Current status
│   └── ...
│
└── README.md            # This file
```

## API Routes

### Authentication
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - OAuth callback
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Curriculum
- `POST /api/curriculum/generate` - Generate new curriculum
- `GET /api/curriculum/user/all` - Get all user curricula
- `GET /api/curriculum/:id` - Get specific curriculum
- `DELETE /api/curriculum/:id` - Delete curriculum

### Module
- `POST /api/module/:curriculumId/:moduleIndex/lesson` - Generate/get lesson (streaming)
- `POST /api/module/:curriculumId/:moduleIndex/quiz` - Generate/get quiz
- `POST /api/module/:curriculumId/:moduleIndex/submit` - Submit quiz score
- `POST /api/module/:curriculumId/:moduleIndex/explain` - Get alternative explanation
- `POST /api/module/time` - Track learning time

### Video
- `POST /api/video/search` - Search and score videos for module

## Database Schema

### User
- googleId, email, name, avatar
- subscriptionStatus (free/premium)
- freeMinutesUsed, totalLearningTime
- createdAt

### Curriculum
- userId, topic, duration
- modules[] (embedded)
- currentModuleIndex, completed
- createdAt, updatedAt

### Module (embedded in Curriculum)
- title, description, estimatedTime
- content (lesson text)
- video (videoId, title, contextLine, etc.)
- questions[] (quiz)
- completed, score

## Development

### Frontend Development
```bash
cd client
npm run dev
```

### Backend Development
```bash
cd server
npm start
```

### Build for Production
```bash
cd client
npm run build
```

## Contributing

This is a personal project, but suggestions and feedback are welcome!

## License

MIT License - feel free to use this project as inspiration for your own learning platform.

## Acknowledgments

- **Anthropic Claude** for AI content generation
- **YouTube** for educational video content
- **Google** for OAuth authentication
- **MongoDB** for database hosting
