import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isUuid, safeDescription, safeText } from '../src/server/cloud.js';

test('cloud text validation rejects empty, non-string, and oversized values', () => {
  assert.equal(safeText(' Workspace ', 20), 'Workspace');
  assert.equal(safeText('   ', 20), undefined);
  assert.equal(safeText(123, 20), undefined);
  assert.equal(safeText('x'.repeat(21), 20), undefined);
});

test('optional descriptions default to empty and enforce their size limit', () => {
  assert.equal(safeDescription(undefined, 10), '');
  assert.equal(safeDescription('abc', 10), 'abc');
  assert.equal(safeDescription('x'.repeat(11), 10), undefined);
  assert.equal(safeDescription(null, 10), undefined);
});

test('cloud workspace IDs must be UUIDs', () => {
  assert.equal(isUuid('a2b3c4d5-e6f7-4890-8123-456789abcdef'), true);
  assert.equal(isUuid('not-a-uuid'), false);
  assert.equal(isUuid(''), false);
  assert.equal(isUuid(42), false);
});
