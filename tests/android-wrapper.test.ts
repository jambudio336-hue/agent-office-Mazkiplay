import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.join(import.meta.dirname, '..');

function read(file: string) {
  return readFileSync(path.join(root, file), 'utf8');
}

test('Android companion points to the mobile office and accepts only HTTPS origins', () => {
  const activity = read('android/app/src/main/java/com/mazkiplay/agentoffice/MainActivity.java');
  const manifest = read('android/app/src/main/AndroidManifest.xml');
  assert.match(activity, /normalizeServerOrigin/);
  assert.match(activity, /https/);
  assert.match(activity, /serverOrigin \+ "\/chat\.html"/);
  assert.match(activity, /isOfficeOrigin/);
  assert.match(manifest, /android\.permission\.INTERNET/);
  assert.match(manifest, /android:usesCleartextTraffic="false"/);
  assert.doesNotMatch(activity, /addJavascriptInterface/);
});

test('Android WebView blocks local files, mixed content, and invalid TLS certificates', () => {
  const activity = read('android/app/src/main/java/com/mazkiplay/agentoffice/MainActivity.java');
  assert.match(activity, /setAllowFileAccess\(false\)/);
  assert.match(activity, /setAllowContentAccess\(false\)/);
  assert.match(activity, /MIXED_CONTENT_NEVER_ALLOW/);
  assert.match(activity, /handler\.cancel\(\)/);
  assert.match(activity, /setSafeBrowsingEnabled\(true\)/);
});

test('Android project pins compatible SDK and Gradle versions and publishes a debug APK artifact', () => {
  const app = read('android/app/build.gradle.kts');
  const wrapper = read('android/gradle/wrapper/gradle-wrapper.properties');
  const workflow = read('.github/workflows/android-apk.yml');
  assert.match(app, /compileSdk = 36/);
  assert.match(app, /targetSdk = 36/);
  assert.match(app, /applicationId = "com\.mazkiplay\.agentoffice"/);
  assert.match(wrapper, /gradle-9\.6\.0-bin\.zip/);
  assert.match(wrapper, /distributionSha256Sum=/);
  assert.match(workflow, /assembleDebug/);
  assert.match(workflow, /upload-artifact@v4/);
  assert.match(workflow, /app-debug\.apk/);
});

test('Native Termux bridge requires confirmation and requests stdout, stderr, and exit code', () => {
  const activity = read('android/app/src/main/java/com/mazkiplay/agentoffice/MainActivity.java');
  const receiver = read('android/app/src/main/java/com/mazkiplay/agentoffice/TermuxResultReceiver.java');
  const manifest = read('android/app/src/main/AndroidManifest.xml');
  assert.ok(manifest.includes('com.termux.permission.RUN_COMMAND'));
  assert.ok(manifest.includes('<package android:name="com.termux" />'));
  assert.ok(manifest.includes('android:name=".TermuxResultReceiver"'));
  assert.ok(activity.includes('com.termux.app.RunCommandService'));
  assert.ok(activity.includes('com.termux.RUN_COMMAND_PATH'));
  assert.ok(activity.includes('com.termux.RUN_COMMAND_PENDING_INTENT'));
  assert.ok(activity.includes('Tinjau perintah'));
  assert.ok(activity.includes('Konfirmasi eksekusi'));
  assert.ok(activity.includes('STDOUT:'));
  assert.ok(activity.includes('STDERR:'));
  assert.ok(activity.includes('Exit code:'));
  assert.ok(receiver.includes('getBundleExtra') || receiver.includes('instanceof Bundle'));
  assert.ok(receiver.includes('termux-stdout'));
  assert.ok(receiver.includes('termux-stderr'));
  assert.ok(receiver.includes('termux-exit-code'));
});
