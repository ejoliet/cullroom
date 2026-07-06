#!/usr/bin/env node
/**
 * keygen.js — cullroom Pro License Generator
 *
 * Usage:
 *   node keygen.js --init                                  Generate Ed25519 keypair (first time only)
 *   node keygen.js --key "Studio" "Name" [maxPhotos]       Issue a signed license (JSON on stdout)
 *   node keygen.js --verify '<license-json>'               Verify a license JSON string
 *
 * keys/private.pem and keys/public.pem are gitignored. Never commit them.
 * Embed the PUBLIC_KEY_B64 printed by --init as PRO_PUBKEY_B64 in host.html.
 * (client.html does not verify licenses.)
 *
 * AIDEV-NOTE: security — the previous keypair (private key formerly hardcoded
 * in this file, public key 'MCowBQYDK2VwAyEAQN3Mg8bxnSuRehaY+RIXgoaZAWOFzze3oo40P1pnhnE=')
 * was committed to git history and MUST be considered compromised. Never accept
 * licenses signed by it; never re-embed that public key anywhere.
 */

'use strict';

const { generateKeyPairSync, sign, verify, createPrivateKey, createPublicKey } = require('crypto');
const fs   = require('fs');
const path = require('path');

const KEYS_DIR         = path.join(__dirname, 'keys');
const PRIVATE_KEY_PATH = path.join(KEYS_DIR, 'private.pem');
const PUBLIC_KEY_PATH  = path.join(KEYS_DIR, 'public.pem');

const [,, cmd, ...args] = process.argv;

// ── --init: generate keypair ────────────────────────────────────────────────
if (cmd === '--init') {
  if (fs.existsSync(PRIVATE_KEY_PATH)) {
    console.error('keys/private.pem already exists. Delete it first to regenerate.');
    process.exit(1);
  }

  const { privateKey, publicKey } = generateKeyPairSync('ed25519');

  fs.mkdirSync(KEYS_DIR, { recursive: true });
  fs.writeFileSync(PRIVATE_KEY_PATH, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 });
  // Note: file mode 0o600 is enforced on Unix/macOS only. On Windows, manually
  // restrict access with: icacls keys\private.pem /inheritance:r /grant:r "%USERNAME%":F

  fs.writeFileSync(PUBLIC_KEY_PATH, publicKey.export({ type: 'spki', format: 'pem' }));

  const pubDerB64 = publicKey.export({ type: 'spki', format: 'der' }).toString('base64');

  console.log('✅  Keypair generated.\n');
  console.log('Embed this as PRO_PUBKEY_B64 in host.html:');
  console.log('\n  ' + pubDerB64 + '\n');
  console.log('Private key → keys/private.pem  (gitignored — keep secret!)');
  console.log('Public key  → keys/public.pem');

// ── --key: issue a license ──────────────────────────────────────────────────
} else if (cmd === '--key') {
  const [studio, name, maxPhotosArg] = args;
  if (!studio || !name) {
    console.error('Usage: node keygen.js --key "Studio Name" "Photographer Name" [maxPhotos]');
    process.exit(1);
  }
  if (!fs.existsSync(PRIVATE_KEY_PATH)) {
    console.error('No private key found. Run: node keygen.js --init');
    process.exit(1);
  }

  const privateKey = createPrivateKey(fs.readFileSync(PRIVATE_KEY_PATH));
  const maxPhotos  = parseInt(maxPhotosArg, 10) || 99999;

  const payload = JSON.stringify({
    plan: 'pro',
    name,
    studio,
    maxPhotos,
    issued: new Date().toISOString().slice(0, 10),
    expires: null,
  });

  const payloadBytes = Buffer.from(payload, 'utf8');
  const sig = sign(null, payloadBytes, privateKey);

  const license = {
    payload: payloadBytes.toString('base64'),
    sig: sig.toString('base64'),
  };

  process.stdout.write(JSON.stringify(license, null, 2) + '\n');

// ── --verify: check a license ───────────────────────────────────────────────
} else if (cmd === '--verify') {
  const [licenseJson] = args;
  if (!licenseJson) {
    console.error('Usage: node keygen.js --verify \'<license-json>\'');
    process.exit(1);
  }
  if (!fs.existsSync(PUBLIC_KEY_PATH)) {
    console.error('No public key found. Run: node keygen.js --init');
    process.exit(1);
  }

  try {
    const pubKey = createPublicKey(fs.readFileSync(PUBLIC_KEY_PATH));
    const { payload, sig } = JSON.parse(licenseJson.trim());
    const payloadBytes = Buffer.from(payload, 'base64');
    const sigBytes     = Buffer.from(sig, 'base64');
    const ok = verify(null, payloadBytes, pubKey, sigBytes);

    if (ok) {
      console.log('✅  Valid license');
      console.log('Payload:', JSON.parse(payloadBytes.toString('utf8')));
    } else {
      console.log('❌  Invalid signature');
      process.exit(1);
    }
  } catch (e) {
    console.log('❌  Invalid license:', e.message);
    process.exit(1);
  }

// ── help ────────────────────────────────────────────────────────────────────
} else {
  console.log(`cullroom Pro License Generator

Usage:
  node keygen.js --init                                Generate Ed25519 keypair
  node keygen.js --key "Studio" "Name" [maxPhotos]     Issue a signed license (JSON on stdout)
  node keygen.js --verify '<license-json>'             Verify a license JSON string`);
}
