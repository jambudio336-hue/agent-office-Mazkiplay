import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const app = readFileSync(new URL('../android-standalone/app.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../android-standalone/index.html', import.meta.url), 'utf8');
const canvas = readFileSync(new URL('../android-standalone/canvas-workspace.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../android-standalone/styles.css', import.meta.url), 'utf8');
const intro = readFileSync(new URL('../android-standalone/intro.js', import.meta.url), 'utf8');

test('Android standalone JavaScript and embedded office activity script parse without syntax errors', () => {
  try { new Script(app, { filename: 'android-standalone/app.js' }); } catch (error) { assert.fail('app.js parse error: ' + error.stack); }
  assert.doesNotThrow(() => new Script(canvas, { filename: 'android-standalone/canvas-workspace.js' }));
  const inlineOffice = html.match(/<script>\s*([\s\S]*?)<\/script>/);
  assert.ok(inlineOffice, 'inline office activity script exists');
  assert.doesNotThrow(() => new Script(inlineOffice[1], { filename: 'android-standalone/index.html#office-script' }));
});

test('Canvas has a multi-file explorer, local persistence, safe paths, and project export', () => {
  for (const id of ['canvas-file-tree', 'canvas-new-file', 'canvas-save-project', 'canvas-export-project', 'canvas-preview']) {
    assert.match(html, new RegExp('id="' + id + '"'));
  }
  assert.match(canvas, /mazkiplay-canvas-workspace-v2/);
  assert.match(canvas, /function safePath/);
  assert.match(canvas, /part === "\.\."/);
  assert.match(canvas, /function renderTree/);
  assert.match(canvas, /JSON\.stringify\(\{name:"Mazkiplay project"/);
  assert.match(html, /sandbox="allow-forms allow-modals allow-scripts"/);
  assert.match(css, /\.canvas-workspace-pro/);
});

test('AI task results can be opened in Canvas and real task state reaches the office log', () => {
  assert.match(app, /data-canvas-result=/);
  assert.match(app, /mazkiplay:canvas-result/);
  assert.match(app, /mazkiplay:office-task/);
  assert.match(html, /addEventListener\('mazkiplay:office-task'/);
  assert.match(html, /gerakan idle tetap simulasi/i);
});


test('native device bridge is packaged with explicit opt-in accessibility', () => {
  const plugin = readFileSync(new URL('../android-standalone/native-android/src/main/java/id/mazkiplay/agentoffice/MazkiplayDeviceBridgePlugin.java', import.meta.url), 'utf8');
  const service = readFileSync(new URL('../android-standalone/native-android/src/main/java/id/mazkiplay/agentoffice/MazkiplayAccessibilityService.java', import.meta.url), 'utf8');
  const workflow = readFileSync(new URL('../.github/workflows/android-apk.yml', import.meta.url), 'utf8');
  const activity = readFileSync(new URL('../android-standalone/native-android/src/main/java/id/mazkiplay/agentoffice/MainActivity.java', import.meta.url), 'utf8');
  const config = readFileSync(new URL('../android-standalone/native-android/src/main/res/xml/mazkiplay_accessibility_service.xml', import.meta.url), 'utf8');
  assert.match(html, /id="device-accessibility-status"/);
  assert.match(html, /id="device-read-screen"/);
  assert.match(app, /MazkiplayDeviceBridge/);
  assert.match(plugin, /Settings\.ACTION_ACCESSIBILITY_SETTINGS/);
  assert.match(plugin, /readScreenSummary/);
  assert.match(service, /if \(node\.isPassword\(\)\) return/);
  assert.match(service, /does not click, type, submit forms/i);
  assert.match(config, /canRetrieveWindowContent="true"/);
  assert.match(config, /canPerformGestures="false"/);
  assert.match(activity, /registerPlugin\(MazkiplayDeviceBridgePlugin\.class\)/);
  assert.match(workflow, /MazkiplayAccessibilityService\.java/);
  assert.match(workflow, /BIND_ACCESSIBILITY_SERVICE/);
});


test('Local backup UI exports portable JSON without provider secrets and validates imports before replacement', () => {
  assert.match(html, /id="backup-export"/);
  assert.match(html, /id="backup-import-trigger"/);
  assert.match(app, /format:"mazkiplay-agent-office-backup"/);
  assert.match(app, /delete copy\.key/);
  assert.match(app, /MAX_TASKS/);
  assert.match(app, /!confirm\("Pulihkan "/);
  assert.match(app, /Token dan API key tidak akan diimpor/);
});


test('Task board supports local search, status filters, live counts, and reset', () => {
  assert.match(html, /id="task-search"/);
  assert.match(html, /id="task-filter"/);
  assert.match(html, /value="running"/);
  assert.match(html, /id="task-filter-summary"/);
  assert.match(app, /function taskStatusOf\(t\)/);
  assert.match(app, /function visibleTasks\(\)/);
  assert.match(app, /task-clear-filters/);
  assert.match(app, /Menampilkan .* dari .* tugas/);
});


test('AI employee profiles can be renamed safely and remain callable by their chosen name', () => {
  assert.match(app, /data-rename=/);
  assert.match(app, /prompt\("Nama baru untuk karyawan AI ini:",w\.name\)/);
  assert.match(app, /name\.length>48/);
  assert.match(app, /function refreshEmployeeCommandChoices\(\)/);
  assert.match(app, /esc\(w\.name\)\+" — "\+esc\(w\.role\)/);
  assert.match(app, /Kamu bisa memanggilnya dari Pusat Perintah Perangkat/);
});


test('Startup intro references the packaged PNG asset and has a safe skip path', () => {
  assert.match(html, /src="\.\/assets\/mazkiplay-intro\.png"/);
  assert.match(intro, /android-standalone\/assets\/mazkiplay-intro\.png/);
  assert.doesNotMatch(intro, /mazkiplay-intro\.jpg/);
  assert.match(html, /id="intro-skip"/);
  assert.match(intro, /skip\.addEventListener\("click", finish\)/);
  assert.match(intro, /audio\.addEventListener\("error"/);
});
