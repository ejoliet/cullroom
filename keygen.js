#!/usr/bin/env node
/**
 * keygen.js — cullroom Pro License Generator
 *
 * Usage:
 *   node keygen.js "<StudioName>" "<PhotographerName>" [maxPhotos] > cullroom-license.json
 *
 * Arguments (positional):
 *   1. StudioName       — branding shown on the client view (e.g. "Smith Photography")
 *   2. PhotographerName — license holder's name         (e.g. "Jane Smith")
 *   3. maxPhotos        — optional photo cap (default: 99999)
 *
 * Example:
 *   node keygen.js "Smith Photography" "Jane Smith" 99999 > cullroom-license.json
 *
 * The resulting JSON is pasted into the Pro Key input on host.html.
 *
 * SECURITY: Keep this file (and the private key below) confidential.
 * Only the public key is embedded in host.html / client.html.
 */

'use strict';

const { createPrivateKey, sign } = require('crypto');

// AIDEV-NOTE: Ed25519 private key (PKCS8 DER, base64).
// Generated once offline. The matching public key (SPKI DER, base64)
// is hardcoded in host.html and client.html as PRO_PUBKEY_B64.
// Replace both keypair constants together if you rotate keys.
//
// SECURITY: Set the CULLROOM_PRIVATE_KEY environment variable in production
// to avoid storing the private key in source. The fallback hardcoded value
// is suitable only for local/demo use and should be replaced for real deployments.
const PRIV_KEY_B64 = process.env.CULLROOM_PRIVATE_KEY
  || 'MC4CAQAwBQYDK2VwBCIEIKA1ZJxYRuYD/px2MMxI8YYgpZ5xjSbYHJxCv833/hsV';

function usage() {
  console.error('Usage: node keygen.js "Studio Name" "Photographer Name" [maxPhotos]');
  process.exit(1);
}

const [,, studio, name, maxPhotosArg] = process.argv;
if (!studio || !name) usage();

const maxPhotos = parseInt(maxPhotosArg, 10) || 99999;

const payload = JSON.stringify({
  plan: 'pro',
  name,
  studio,
  maxPhotos,
  issued: new Date().toISOString().slice(0, 10),
  expires: null,
});

const privKeyDer = Buffer.from(PRIV_KEY_B64, 'base64');
const privateKey = createPrivateKey({ key: privKeyDer, format: 'der', type: 'pkcs8' });

const payloadBytes = Buffer.from(payload, 'utf8');
const sig = sign(null, payloadBytes, privateKey);

const license = {
  payload: payloadBytes.toString('base64'),
  sig: sig.toString('base64'),
};

process.stdout.write(JSON.stringify(license, null, 2) + '\n');
