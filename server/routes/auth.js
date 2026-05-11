const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();
const logger = require('../utils/logger');

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

router.get('/google/callback',
  (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user) => {
      if (err || !user) {
        logger.auth('LOGIN_FAILED', { error: err?.message || 'No user returned', ip: req.ip });
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
      }
      req.user = user;
      next();
    })(req, res, next);
  },
  (req, res) => {
    const token = jwt.sign(
      {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name || req.user.displayName || req.user.email?.split('@')[0] || 'Learner'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    logger.auth('LOGIN_SUCCESS', { userId: req.user.id });
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

// Get current user
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const User = require('../models/User');
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({ 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        subscriptionStatus: user.subscriptionStatus,
        freeMinutesUsed: user.freeMinutesUsed
      }
    });
  } catch (error) {
    logger.security('INVALID_TOKEN', { ip: req.ip, path: req.path });
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Subscribe (placeholder - no Stripe yet)
router.patch('/user/subscribe', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const User = require('../models/User');
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    user.subscriptionStatus = 'active';
    await user.save();
    
    res.json({ 
      message: 'Subscription activated',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        subscriptionStatus: user.subscriptionStatus,
        freeMinutesUsed: user.freeMinutesUsed
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;