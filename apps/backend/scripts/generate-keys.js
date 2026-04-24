#!/usr/bin/env node
/**
 * scripts/generate-keys.js
 *
 * Generates RS256 key pair and prints the base64-encoded values
 * ready to paste into your .env file.
 *
 * Usage:
 *   node scripts/generate-keys.js
 *
 * Then copy the output into your .env:
 *   JWT_PRIVATE_KEY=<printed value>
 *   JWT_PUBLIC_KEY=<printed value>
 */
'use strict';
const { generateKeyPairSync } = require('crypto');

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding:  { type: 'spki',  format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const privateB64 = Buffer.from(privateKey).toString('base64');
const publicB64  = Buffer.from(publicKey).toString('base64');

console.log('\n✅ RS256 key pair generated. Copy these into your .env:\n');
console.log(`JWT_PRIVATE_KEY=${privateB64}`);
console.log(`JWT_PUBLIC_KEY=${publicB64}`);
console.log('\n⚠️  Keep JWT_PRIVATE_KEY secret — never commit it to git!\n');