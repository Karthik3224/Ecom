export const supportedLanguages = ['English', 'Hindi', 'Telugu'];
export const normalizeLanguage = (value) => supportedLanguages.includes(value) ? value : 'English';
export const readLanguage = (storage) => {
  try { return normalizeLanguage(storage.getItem('language')); } catch { return 'English'; }
};
export const persistLanguage = (storage, value) => {
  const language = normalizeLanguage(value);
  try { storage.setItem('language', language); } catch { /* The UI can still switch when storage is unavailable. */ }
  return language;
};
