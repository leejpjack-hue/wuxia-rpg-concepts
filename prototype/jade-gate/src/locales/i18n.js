import { messages } from './ja.js';
import { contentMessages } from './ja-content.js';
const catalog = {...messages, ...contentMessages};
export const DEFAULT_LANGUAGE = 'ja';
export const LANGUAGES = ['ja', 'en'];
const exact = new Map(Object.entries(catalog).map(([key, value]) => [key.toLowerCase(), value]));
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const templates = Object.entries(catalog).filter(([key]) => key.includes('{')).map(([key, value]) => {
  const names = [...key.matchAll(/\{(\w+)\}/g)].map(match => match[1]);
  const parts = key.split(/\{\w+\}/).map(escape);
  return { pattern: new RegExp('^' + parts.join('(.+?)') + '$', 'iu'), names, value };
});
export function translate(text, language = DEFAULT_LANGUAGE, depth = 0) {
  if (language === 'en' || typeof text !== 'string' || !text || depth > 4) return text;
  const value = exact.get(text.toLowerCase());
  if (value !== undefined) return value;
  for (const template of templates) {
    const match = text.match(template.pattern);
    if (!match) continue;
    const values = Object.fromEntries(template.names.map((key, index) => [key, translate(match[index + 1], language, depth + 1)]));
    return template.value.replace(/\{(\w+)\}/g, (_, key) => values[key]);
  }
  return text;
}
export function localizeDocument(document, language = DEFAULT_LANGUAGE) {
  if (document.documentElement) document.documentElement.lang = language;
  for (const node of document.querySelectorAll('[data-i18n]'))
    node.textContent = translate(node.dataset.i18n, language);
  for (const node of document.querySelectorAll('[data-i18n-aria]'))
    node.setAttribute('aria-label', translate(node.dataset.i18nAria, language));
}
