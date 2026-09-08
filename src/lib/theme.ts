/**
 * 主题管理：在文档根元素上切换浅色/深色主题。
 */

/** 主题标识。 */
export type Theme = 'light' | 'dark';

/**
 * 应用主题到文档根元素。
 *
 * @param theme 主题标识
 */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
}
