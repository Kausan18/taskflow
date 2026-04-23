'use strict';
const { Router } = require('express');
const passport   = require('passport');
const { z }      = require('zod');
const controller = require('./auth.controller');
const { verifyJWT }      = require('../../middleware/verifyJWT');
const { authRateLimiter } = require('../../middleware/rateLimiter');

const router = Router();

// ── Zod validation schemas ──────────────────────────────────────────────────

const registerSchema = z.object({
  orgName:  z.string().min(1),
  name:     z.string().min(1),
  email:    z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email:        z.string().email(),
  password:     z.string().min(1),
  captchaToken: z.string().optional(),
});

// Inline Zod validation middleware factory
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      message: 'Validation failed',
      errors:  result.error.flatten().fieldErrors,
    });
  }
  req.body = result.data;
  next();
};

// ── Routes ──────────────────────────────────────────────────────────────────

// POST /api/auth/register
router.post('/register', authRateLimiter, validate(registerSchema), controller.register);

// POST /api/auth/login
router.post('/login', authRateLimiter, validate(loginSchema), controller.login);

// POST /api/auth/refresh  (refresh token is in HTTP-only cookie)
router.post('/refresh', controller.refresh);

// POST /api/auth/logout
router.post('/logout', verifyJWT, controller.logout);

// GET  /api/auth/me
router.get('/me', verifyJWT, controller.getMe);

// GET  /api/auth/google  — initiates OAuth flow
router.get(
  '/google',
  passport.authenticate('google', { session: false, scope: ['profile', 'email'] })
);

// GET  /api/auth/google/callback  — Passport exchanges code → profile → calls verify fn
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=oauth' }),
  controller.googleCallback
);

module.exports = router;