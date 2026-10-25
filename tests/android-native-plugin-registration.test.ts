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

test('Capacitor registers the native device bridge and notification plugin', () => {
  assert.match(activity, /registerPlugin\\(MazkiplayDeviceBridgePlugin\\.class\\)/);
  assert.match(activity, /registerPlugin\\(MazkiplayNotificationsPlugin\\.class\\)/);
  const notificationPlugin = readFileSync(new URL('../android-standalone/native-android/src/main/java/id/mazkiplay/agentoffice/MazkiplayNotificationsPlugin.java', import.meta.url), 'utf8');
  assert.match(notificationPlugin, /@CapacitorPlugin\\(name = "MazkiplayNotifications"/);
  assert.match(notificationPlugin, /requestPermission\\(PluginCall call\\)/);
  assert.match(notificationPlugin, /@PluginMethod public void notify\\(PluginCall call\\)/);
  assert.match(notificationPlugin, /POST_NOTIFICATIONS/);
});

test('Android workflow packages the notification bridge and declares runtime permission', () => {
  const workflow = readFileSync(new URL('../.github/workflows/android-apk.yml', import.meta.url), 'utf8');
  assert.match(workflow, /MazkiplayNotificationsPlugin\\.java/);
  assert.match(workflow, /android\\.permission\\.POST_NOTIFICATIONS/);
  assert.match(workflow, /npm run typecheck/);
  assert.match(workflow, /npm test/);
});

test('standalone app wires persistent theme, Indonesian live clock, and native notification UI', () => {
  const styles = readFileSync(new URL('../android-standalone/styles.css', import.meta.url), 'utf8');
  assert.match(html, /id="theme-toggle"/);
  assert.match(html, /id="live-date"/);
  assert.match(html, /id="live-time"/);
  assert.match(app, /localStorage\\.getItem\\('mazkiplay-theme'\\)/);
  assert.match(app, /localStorage\\.setItem\\('mazkiplay-theme',next\\)/);
  assert.match(app, /Intl\\.DateTimeFormat\\('id-ID'/);
  assert.match(app, /setInterval\\(tickClock,1000\\)/);
  assert.match(app, /MazkiplayNotifications/);
  assert.match(app, /notification-permission/);
  assert.match(app, /notification-test/);
  assert.match(styles, /data-theme="light"/);
});
