/**
 * Theme Configuration and Accent Color Management
 */

export interface AccentColor {
  name: string;
  value: string;
  label: string;
  emoji: string;
}

export const ACCENT_COLORS: AccentColor[] = [
  { name: 'orange', value: '#ff7b00', label: 'Orange', emoji: '🟠' },
  { name: 'red', value: '#ef4444', label: 'Red', emoji: '🔴' },
  { name: 'pink', value: '#ec4899', label: 'Pink', emoji: '🩷' },
  { name: 'purple', value: '#a855f7', label: 'Purple', emoji: '🟣' },
  { name: 'blue', value: '#3b82f6', label: 'Blue', emoji: '🔵' },
  { name: 'cyan', value: '#06b6d4', label: 'Cyan', emoji: '🔷' },
  { name: 'green', value: '#10b981', label: 'Green', emoji: '🟢' },
  { name: 'yellow', value: '#eab308', label: 'Yellow', emoji: '🟡' },
];

const THEME_STORAGE_KEY = 'seven_accent_color';

/**
 * Get the current accent color from localStorage
 */
export const getAccentColor = (): AccentColor => {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored) {
    const found = ACCENT_COLORS.find(c => c.name === stored);
    if (found) return found;
  }
  return ACCENT_COLORS[0]; // Default to orange
};

/**
 * Set the accent color and persist to localStorage
 */
export const setAccentColor = (colorName: string): void => {
  localStorage.setItem(THEME_STORAGE_KEY, colorName);
  applyAccentColor(colorName);
};

/**
 * Apply accent color to CSS variables
 */
export const applyAccentColor = (colorName: string): void => {
  const color = ACCENT_COLORS.find(c => c.name === colorName);
  if (!color) return;

  const root = document.documentElement;
  
  // Convert hex to RGB for opacity support
  const hex = color.value.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Set CSS variables
  root.style.setProperty('--color-primary', `${r}, ${g}, ${b}`);
  root.style.setProperty('--color-primary-hex', color.value);
  
  // Update theme-color meta tag for PWA
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', color.value);
  }
};

/**
 * Initialize theme on app load
 */
export const initializeTheme = (): void => {
  const color = getAccentColor();
  applyAccentColor(color.name);
};














