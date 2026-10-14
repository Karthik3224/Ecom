import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { cleanDisplayText } from '../utils/textEncoding.js';
import { readLanguage, persistLanguage } from './preferences.js';

test('switching all languages repeatedly persists and restores before rendering', () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) };
  assert.equal(readLanguage(storage), 'English');
  for (let pass = 0; pass < 3; pass++) {
    for (const language of ['Hindi', 'Telugu', 'English']) {
      assert.equal(persistLanguage(storage, language), language);
      assert.equal(readLanguage(storage), language);
    }
  }
  assert.equal(persistLanguage(storage, 'invalid'), 'English');
  assert.equal(readLanguage({ getItem() { throw new Error('blocked'); } }), 'English');
});

test('all supported languages contain complete, valid UTF-8 resources', () => {
  const dictionaries = ['english', 'hindi', 'telugu'].map((name) => {
    const bytes = fs.readFileSync(new URL(`./${name}.json`, import.meta.url));
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  });
  const keys = Object.keys(dictionaries[0]).sort();
  for (const dictionary of dictionaries) {
    assert.deepEqual(Object.keys(dictionary).sort(), keys);
    for (const value of Object.values(dictionary)) {
      assert.equal(typeof value, 'string');
      assert.ok(value.trim());
      assert.doesNotMatch(value, /[�ÃÂ]|à[¤°]|â[€‚]/u);
      assert.equal(cleanDisplayText(value), value);
    }
  }
  assert.match(dictionaries[1].home, /[\u0900-\u097f]/u);
  assert.match(dictionaries[2].home, /[\u0c00-\u0c7f]/u);
});

test('encoding repair preserves legitimate Unicode and never creates replacement characters', () => {
  for (const text of ['वितरण', 'తెలుగు', 'ವಿತರಣಾ', '₹399.00', 'नमस्ते, Customer', 'à la carte', 'Hindi �']) {
    assert.equal(cleanDisplayText(text), text);
  }
  assert.equal(cleanDisplayText('à¤¹à¥‹à¤®'), 'होम');
});
