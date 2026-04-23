'use strict';
const authService = require('./auth.service');

const REFRESH_COOKIE = 'refreshToken';

async function register(req, res, next) {
  try {
    const { orgName, name, email, password } = req.body;
    const { accessToken, refreshRaw, user } = await authService.register({ orgName, name, email, password });

    res.cookie(REFRESH_COOKIE, refreshRaw, authService.refreshCookieOptions());
    res.status(201).json({ accessToken, user });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password, captchaToken } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const { accessToken, refreshRaw, user } = await authService.login({ email, password, captchaToken }, ip);

    res.cookie(REFRESH_COOKIE, refreshRaw, authService.refreshCookieOptions());
    res.json({ accessToken, user });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE];
    if (!rawToken) {
      return res.status(401).json({ message: 'Refresh token cookie missing' });
    }
    const { accessToken, refreshRaw, user } = await authService.refresh(rawToken);

    res.cookie(REFRESH_COOKIE, refreshRaw, authService.refreshCookieOptions());
    res.json({ accessToken, user });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    await authService.logout(req.user.id);
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth/refresh' });
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await authService.getMe(req.user.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

// Called by Passport after Google OAuth callback succeeds
async function googleCallback(req, res, next) {
  try {
    const { accessToken, refreshRaw } = await authService.issueTokensForOAuthUser(req.user);
    res.cookie(REFRESH_COOKIE, refreshRaw, authService.refreshCookieOptions());

    // Redirect to frontend with access token in query param (frontend grabs it once and stores in memory)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}`);
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, logout, getMe, googleCallback };