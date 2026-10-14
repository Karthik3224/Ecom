import english from './english.json';
import hindi from './hindi.json';
import telugu from './telugu.json';
import { normalizeLanguage } from './preferences.js';
export { normalizeLanguage } from './preferences.js';

export const resources = { English: english, Hindi: hindi, Telugu: telugu };
export const languageCode = (value) => ({ English: 'en', Hindi: 'hi', Telugu: 'te' })[normalizeLanguage(value)];
export const translate = (language, key, values = {}) => {
  const text = resources[normalizeLanguage(language)][key] || english[key] || english.unavailable || 'Unavailable';
  return text.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ''));
};
