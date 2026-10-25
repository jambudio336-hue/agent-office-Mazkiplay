import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const activity = readFileSync(new URL('../android-standalone/native-android/src/main/java/id/mazkiplay/agentoffice/MainActivity.java', import.meta.url), 'utf8');
const llm = readFileSync(new URL('../android-standalone/native-android/src/main/java/id/mazkiplay/agentoffice/MazkiplayLocalLLMPlugin.kt', import.meta.url), 'utf8');
const html = readFileSync(new URL('../android-standalone/index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../android-standalone/app.js', import.meta.url), 'utf8');

test('Capacitor registers both encrypted secret storage and local LLM plugins', () => {
  assert.match(activity, /registerPlugin\(MazkiplaySecureStoragePlugin\.class\)/);
  assert.match(activity, /registerPlugin\(MazkiplayLocalLLMPlugin\.class\)/);
});

test('native local LLM exposes the methods used by the UI bridge', () => {
  for (const method of ['getStatus', 'downloadModel', 'prepareModel', 'generate', 'resetConversation']) {
    assert.match(llm, new RegExp('fun ' + method + '\\(call: PluginCall\\)'));
  }
  for (const method of ['getStatus', 'downloadModel', 'prepareModel', 'generate', 'resetConversation']) {
    assert.ok(app.includes(method), 'UI bridge should reference native method ' + method);
  }
  assert.match(html, /id="local-llm-download"/);
  assert.match(html, /id="local-llm-prepare"/);
  assert.match(html, /id="local-llm-reset"/);
});

test('model downloads reject unexpected sizes and do not expose partial files as ready', () => {
  assert.match(llm, /MIN_MODEL_BYTES/);
  assert.match(llm, /MAX_MODEL_BYTES/);
  assert.match(llm, /\.part/);
  assert.match(llm, /downloaded !in MIN_MODEL_BYTES\.\.MAX_MODEL_BYTES/);
  assert.match(llm, /partial\.delete\(\)/);
});

test('native inference is bounded and explicitly reports offline model identity', () => {
  assert.match(llm, /prompt\.length > 4000/);
  assert.match(llm, /result\.put\("offline", true\)/);
  assert.match(llm, /result\.put\("model", "Qwen3 0\.6B INT4"\)/);
});
