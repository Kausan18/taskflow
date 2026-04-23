'use strict';
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
      scope: ['profile', 'email'],
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error('No email from Google profile'));

        // Check if user already exists (email/password or previous OAuth)
        let user = await prisma.user.findUnique({ where: { email } });

        if (user) {
          // Link Google OAuth to existing account if not already linked
          if (!user.oauthProvider) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { oauthProvider: 'google', oauthId: profile.id },
            });
          }
          return done(null, user);
        }

        // New user — they need an org. For OAuth we create a personal org.
        // The org slug is derived from their email domain.
        const domain = email.split('@')[1].replace(/\./g, '-');
        const slugBase = `${domain}-${Date.now()}`;

        const org = await prisma.organisation.create({
          data: { name: profile.displayName || email, slug: slugBase },
        });

        user = await prisma.user.create({
          data: {
            orgId: org.id,
            email,
            name: profile.displayName || email,
            role: 'ADMIN',
            oauthProvider: 'google',
            oauthId: profile.id,
          },
        });

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

module.exports = passport;