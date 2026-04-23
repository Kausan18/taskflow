'use strict';
const { createClient } = require('@supabase/supabase-js');

// Server-side client uses the SERVICE ROLE key — never expose this on the frontend.
// Used for Google OAuth token exchange and admin operations.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

module.exports = supabase;