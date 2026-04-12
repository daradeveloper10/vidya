const express = require('express');
const passport = require('passport');
const router = express.Router();

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed`,
    session: true
  }),
  (req, res) => {
    const token = Buffer.from(req.user._id.toString()).toString('base64');
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

// Get current user
router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ 
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar,
        subscriptionStatus: req.user.subscriptionStatus,
        freeMinutesUsed: req.user.freeMinutesUsed
      }
    });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Subscribe (placeholder - no Stripe yet)
router.patch('/user/subscribe', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  req.user.subscriptionStatus = 'active';
  req.user.save()
    .then(() => {
      res.json({ 
        message: 'Subscription activated',
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          avatar: req.user.avatar,
          subscriptionStatus: req.user.subscriptionStatus,
          freeMinutesUsed: req.user.freeMinutesUsed
        }
      });
    })
    .catch((err) => {
      console.error('Error updating subscription:', err);
      res.status(500).json({ error: 'Failed to update subscription' });
    });
});

module.exports = router;