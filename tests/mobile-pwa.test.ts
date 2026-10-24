import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const root = path.join(import.meta.dirname, '..');
const client = path.join(root, 'src/client');

function read(file: string) {
  return readFileSync(path.join(root, file), 'utf8');
}

test('mobile office is installable from its Indonesian lite route', () => {
  const manifest = JSON.parse(read('src/client/public/manifest.webmanifest')) as {
    name: string;
    lang: string;
    start_url: string;
    display: string;
    icons: { src: string; sizes: string; type: string }[];
  };
  assert.equal(manifest.name, 'M4zK1pL4Y Agent Office');
  assert.equal(manifest.lang, 'id-ID');
  assert.equal(manifest.start_url, '/lite');
  assert.equal(manifest.display, 'standalone');
  for (const icon of manifest.icons) {
    const file = path.join(client, 'public', path.basename(icon.src));
    assert.ok(existsSync(file), `${icon.src} exists`);
    const png = readFileSync(file);
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    const expected = Number(icon.sizes.split('x')[0]);
    assert.equal(png.readUInt32BE(16), expected);
    assert.equal(png.readUInt32BE(20), expected);
  }
  assert.match(read('src/client/lite.html'), /<html lang="id">/);
  assert.match(read('src/client/lite.html'), /rel="manifest" href="\/manifest\.webmanifest"/);
});

test('dashboard routes instructions to real workers and does not invent AI replies', () => {
  const lite = read('src/client/lite.ts');
  const dashboard = read('src/client/ui/mobile/dashboard.ts');
  const delegation = read('src/client/ui/mobile/delegation.ts');
  assert.match(lite, /t: 'worker\.prompt'/);
  assert.match(dashboard, /store\.on\('workers'/);
  assert.match(dashboard, /tugaskan|rekrut/i);
  assert.match(delegation, /agent-office tell_worker/);
  assert.match(delegation, /Jangan mengklaim tugas selesai/);
});

test('first-run mobile welcome uses the supplied-brand text and bundles real video media', () => {
  const welcome = read('src/client/ui/mobile/welcome.ts');
  assert.match(welcome, /Welcome to M4zK1pL4Y Agent Office/);
  assert.match(welcome, /kecerdasan buatan|artificial intelejen/i);
  const video = path.join(client, 'public/welcome-intro.mp4');
  assert.ok(existsSync(video));
  assert.ok(statSync(video).size > 1_000_000, 'intro video contains real video/audio media');
});
