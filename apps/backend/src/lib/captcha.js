'use strict';
const axios = require('axios');

/**
 * Verify an hCaptcha token submitted by the frontend.
 * Returns true if valid, false otherwise.
 *
 * hCaptcha is triggered after 3 consecutive failed login attempts.
 * The Redis key `login:failures:<ip>` tracks the count.
 */
async function verifyCaptcha(token) {
  if (!token) return false;

  // In development with no secret configured, skip verification
  if (!process.env.HCAPTCHA_SECRET) {
    console.warn('[Captcha] HCAPTCHA_SECRET not set — skipping verification in dev');
    return true;
  }

  try {
    const params = new URLSearchParams({
      secret:   process.env.HCAPTCHA_SECRET,
      response: token,
    });
    const { data } = await axios.post('https://hcaptcha.com/siteverify', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return data.success === true;
  } catch (err) {
    console.error('[Captcha] Verification request failed:', err.message);
    return false;
  }
}

module.exports = { verifyCaptcha };