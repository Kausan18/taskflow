'use strict';
const passport = require('passport');

// Only register Google OAuth strategy if credentials are configured.
// This lets the server start cleanly in dev even without Google credentials.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  passport.use(
    new GoogleStrategy(
      {
        clientID:     process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:  process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
        scope: ['profile', 'email'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error('No email from Google profile'));

          let user = await prisma.user.findUnique({ where: { email } });

          if (user) {
            if (!user.oauthProvider) {
              user = await prisma.user.update({
                where: { id: user.id },
                data:  { oauthProvider: 'google', oauthId: profile.id },
              });
            }
            return done(null, user);
          }

          // New Google user — create a personal org from their email domain
          const domain   = email.split('@')[1].replace(/\./g, '-');
          const slugBase = `${domain}-${Date.now()}`;

          const org = await prisma.organisation.create({
            data: { name: profile.displayName || email, slug: slugBase },
          });

          user = await prisma.user.create({
            data: {
              orgId:         org.id,
              email,
              name:          profile.displayName || email,
              role:          'ADMIN',
              oauthProvider: 'google',
              oauthId:       profile.id,
            },
          });

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  console.log('✅ Google OAuth strategy registered');
} else {
  console.log('ℹ️  Google OAuth disabled (GOOGLE_CLIENT_ID not set) — email/password auth only');
}

module.exports = passport;