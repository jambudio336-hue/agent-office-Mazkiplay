import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../android-standalone/app.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../android-standalone/index.html', import.meta.url), 'utf8');
const localLlm = readFileSync(new URL('../android-standalone/native-android/src/main/java/id/mazkiplay/agentoffice/MazkiplayLocalLLMPlugin.kt', import.meta.url), 'utf8');
const secureStorage = readFileSync(new URL('../android-standalone/native-android/src/main/java/id/mazkiplay/agentoffice/MazkiplaySecureStoragePlugin.java', import.meta.url), 'utf8');
const improvement = readFileSync(new URL('../android-standalone/self-improvement.js', import.meta.url), 'utf8');

test('provider and GitHub credentials are not written into the app localStorage record', () => {
  assert.match(app, /function save\(\)/);
  assert.match(app, /delete copy\.key/);
  assert.match(app, /function secureStore\(\)/);
  assert.match(app, /saveProviderSecret/);
  assert.match(app, /saveGithubSecret/);
});

test('local-first mode is the default and local generation is routed separately from API mode', () => {
  assert.match(app, /aiMode:"local"/);
  assert.match(app, /async function generateLocalAnswer\(/);
  assert.match(app, /callModelWithFallback/);
  assert.match(html, /Gratis Lokal — tanpa API key/);
  assert.match(html, /API Mode/);
});

test('local model downloads are bounded, staged, and reject incomplete or unexpected files', () => {
  assert.match(localLlm, /MIN_MODEL_BYTES/);
  assert.match(localLlm, /MAX_MODEL_BYTES/);
  assert.match(localLlm, /\.part/);
  assert.match(localLlm, /downloaded !in MIN_MODEL_BYTES\.\.MAX_MODEL_BYTES/);
  assert.match(localLlm, /partial\.delete\(\)/);
  assert.match(localLlm, /output\.fd\.sync\(\)/);
});

test('Android secret storage uses Keystore-backed AES-GCM with randomized encryption', () => {
  assert.match(secureStorage, /AndroidKeyStore/);
  assert.match(secureStorage, /AES\/GCM\/NoPadding/);
  assert.match(secureStorage, /setRandomizedEncryptionRequired\(true\)/);
  assert.match(secureStorage, /GCMParameterSpec\(GCM_TAG_BITS, iv\)/);
  assert.match(secureStorage, /prefs\.edit\(\)\.putString\(storageKey\(key\), encrypt\(value\)\)/);
  assert.match(secureStorage, /\.remove\(storageKey\(key\)\)/);
});

test('self-improvement records suggestions but never silently rewrites code or installs updates', () => {
  assert.match(improvement, /never silently rewrites code or installs updates/i);
  assert.match(improvement, /tidak mengubah kode/);
  assert.match(improvement, /Draft PR/);
  assert.match(improvement, /localStorage/);
});
