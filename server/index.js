require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/auth');
const curriculumRoutes = require('./routes/curriculum');
const moduleRoutes = require('./routes/module');
const videoRoutes = require('./routes/video');
const topicsRoutes = require('./routes/topics');
const pathsRoutes = require('./routes/paths');
const userPathsRoutes = require('./routes/userPaths');
const { startTopicRefreshJob } = require('./jobs/topicRefreshJob');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: 'https://vidya-six.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration (kept for passport compatibility)
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    sameSite: 'none',
    httpOnly: true
  }
}))

// Passport initialization
app.use(passport.initialize());

// Passport Google OAuth configuration
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/User');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'https://vidya-server.onrender.com/api/auth/google/callback',
    },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('🔐 Google OAuth callback received');
      console.log('🆔 Google ID:', profile.id);
      
      let user = await User.findOne({ googleId: profile.id });
      
      if (user) {
        console.log('✅ Existing user found');
        return done(null, user);
      }
      
      console.log('🆕 Creating new user...');
      user = await User.create({
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        avatar: profile.photos[0]?.value
      });
      
      console.log('✅ New user created');
      done(null, user);
    } catch (error) {
      console.error('❌ Google OAuth error:', error);
      done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.log('✅ MongoDB connected successfully');
  startTopicRefreshJob();
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/curriculum', curriculumRoutes);
app.use('/api/module', moduleRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/topics', topicsRoutes);
app.use('/api/paths', pathsRoutes);
app.use('/api/user-paths', userPathsRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Vidya server is running' });
});

// Error handling middleware - shows full error for debugging
app.use((err, req, res, next) => {
  console.error('🔴 Server error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Vidya server running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
    process.exit(1);
  }
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});