const express = require('express');

function createAuthRouter(options = {}) {
  const router = express.Router();
  const authEnabled = Boolean(options.authEnabled);

  router.get('/status', (req, res) => {
    if (!authEnabled) {
      return res.json({ authEnabled: false, isAuthenticated: true });
    }

    return res.json({
      authEnabled: true,
      isAuthenticated: Boolean(req.session?.isAdmin),
      username: req.session?.username || null,
    });
  });

  router.post('/login', (req, res) => {
    if (!authEnabled) {
      return res.json({ ok: true, message: 'Authentication is disabled.' });
    }

    const inputUsername = String(req.body?.username || '').trim();
    const inputPassword = String(req.body?.password || '').trim();
    const adminUsername = String(process.env.ADMIN_USERNAME || 'admin').trim();
    const adminPassword = String(process.env.ADMIN_PASSWORD || 'change-this-password').trim();

    if (inputUsername !== adminUsername || inputPassword !== adminPassword) {
      return res.status(401).json({ ok: false, message: 'Invalid username or password.' });
    }

    req.session.isAdmin = true;
    req.session.username = adminUsername;

    return res.json({ ok: true, message: 'Login successful.' });
  });

  router.post('/logout', (req, res) => {
    if (!authEnabled) {
      return res.json({ ok: true, message: 'Authentication is disabled.' });
    }

    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ ok: true, message: 'Logged out.' });
    });
  });

  return router;
}

function createAuthGuard(options = {}) {
  const authEnabled = Boolean(options.authEnabled);

  return (req, res, next) => {
    if (!authEnabled) {
      return next();
    }

    if (req.session?.isAdmin) {
      return next();
    }

    const acceptsJson = req.headers.accept?.includes('application/json');
    if (acceptsJson || req.path.startsWith('/attendance') || req.path.startsWith('/events')) {
      return res.status(401).json({ message: 'Unauthorized. Please log in as admin.' });
    }

    return res.redirect('/login');
  };
}

module.exports = {
  createAuthRouter,
  createAuthGuard,
};