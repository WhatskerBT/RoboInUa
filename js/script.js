/**
 * M3 Expressive — Interactive Script
 * Scroll reveal, theme toggle, accent colors, mobile nav, filtering
 */

// ============ THEME TOGGLE ============
const THEME_STORAGE_KEY = 'theme';
const THEME_MANUAL_KEY = 'theme_manual';
const systemDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');

function getStoredTheme() {
  if (localStorage.getItem(THEME_MANUAL_KEY) !== '1') return null;
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  return saved === 'dark' || saved === 'light' ? saved : null;
}

function getSystemTheme() {
  return systemDarkQuery.matches ? 'dark' : 'light';
}

function updateBrowserThemeColor(theme) {
  const color = theme === 'dark' ? '#0f141c' : '#f8f9ff';
  let meta = document.querySelector('meta[name="theme-color"][data-dynamic-theme]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    meta.setAttribute('data-dynamic-theme', '1');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', color);
}

function applyTheme(theme, { persist = false } = {}) {
  document.documentElement.dataset.theme = theme;
  if (persist) {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    localStorage.setItem(THEME_MANUAL_KEY, '1');
  }
  updateBrowserThemeColor(theme);
  const icon = document.getElementById('theme-icon');
  if (icon) icon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
  const iconMobile = document.getElementById('theme-icon-mobile');
  if (iconMobile) iconMobile.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme || getSystemTheme();
  applyTheme(current === 'dark' ? 'light' : 'dark', { persist: true });
}

function resetThemeToAuto() {
  localStorage.removeItem(THEME_STORAGE_KEY);
  localStorage.removeItem(THEME_MANUAL_KEY);
  applyTheme(getSystemTheme());
}

function initTheme() {
  if (localStorage.getItem(THEME_MANUAL_KEY) !== '1') {
    localStorage.removeItem(THEME_STORAGE_KEY);
  }
  const stored = getStoredTheme();
  applyTheme(stored || getSystemTheme());
  systemDarkQuery.addEventListener('change', () => {
    if (!getStoredTheme()) applyTheme(getSystemTheme());
  });
}

initTheme();

// ============ MATERIAL YOU — ACCENT COLORS ============
const ACCENT_STORAGE_KEY = 'accent_color';

/**
 * Full M3 tonal palettes per seed color.
 * Each palette includes: primary/secondary/tertiary tokens + surface tints.
 * Surface tokens are from M3 neutral palette (same hue, very low chroma).
 */
const ACCENT_PALETTES = [
  {
    id: 'blue', name: 'Синій', swatch: '#0061a4',
    light: {
      '--md-primary': '#0061a4', '--md-on-primary': '#ffffff',
      '--md-primary-container': '#d1e4ff', '--md-on-primary-container': '#001d36',
      '--md-secondary': '#535f70', '--md-on-secondary': '#ffffff',
      '--md-secondary-container': '#d7e3f7', '--md-on-secondary-container': '#101c2b',
      '--md-tertiary': '#6b5778', '--md-on-tertiary': '#ffffff',
      '--md-tertiary-container': '#f2daff', '--md-on-tertiary-container': '#251431',
      '--md-inverse-primary': '#9ecaff',
      '--md-surface': '#f8f9ff', '--md-surface-dim': '#d8d9e0',
      '--md-surface-bright': '#f8f9ff',
      '--md-surface-container-lowest': '#ffffff',
      '--md-surface-container-low': '#f2f3fa',
      '--md-surface-container': '#ecedf3',
      '--md-surface-container-high': '#e7e8ee',
      '--md-surface-container-highest': '#e1e2e8',
      '--md-on-surface': '#191c20', '--md-on-surface-variant': '#43474e',
      '--md-outline': '#73777f', '--md-outline-variant': '#c3c6cf',
      '--md-inverse-surface': '#2e3036', '--md-inverse-on-surface': '#eff0f7',
      '--md-footer-bg': '#e8eef8', '--md-footer-on-bg': '#1b2433',
    },
    dark: {
      '--md-primary': '#aacbff', '--md-on-primary': '#002f53',
      '--md-primary-container': '#114b78', '--md-on-primary-container': '#d8e8ff',
      '--md-secondary': '#c0c7dc', '--md-on-secondary': '#273141',
      '--md-secondary-container': '#3d4859', '--md-on-secondary-container': '#dbe3f9',
      '--md-tertiary': '#e2c0f8', '--md-on-tertiary': '#412c4f',
      '--md-tertiary-container': '#5b4469', '--md-on-tertiary-container': '#f7ddff',
      '--md-inverse-primary': '#0061a4',
      '--md-surface': '#0f141c', '--md-surface-dim': '#0f141c',
      '--md-surface-bright': '#343a44',
      '--md-surface-container-lowest': '#0a0f16',
      '--md-surface-container-low': '#161c25',
      '--md-surface-container': '#1a212b',
      '--md-surface-container-high': '#252d38',
      '--md-surface-container-highest': '#313947',
      '--md-on-surface': '#e1e7f2', '--md-on-surface-variant': '#c0c7d4',
      '--md-outline': '#8f96a4', '--md-outline-variant': '#444d5b',
      '--md-inverse-surface': '#dce3f0', '--md-inverse-on-surface': '#1b2029',
      '--md-footer-bg': '#101722', '--md-footer-on-bg': '#dce6f8',
    }
  },
  {
    id: 'green', name: 'Зелений', swatch: '#1a6b2f',
    light: {
      '--md-primary': '#1a6b2f', '--md-on-primary': '#ffffff',
      '--md-primary-container': '#a9f0b4', '--md-on-primary-container': '#002109',
      '--md-secondary': '#4e6354', '--md-on-secondary': '#ffffff',
      '--md-secondary-container': '#d1e8d5', '--md-on-secondary-container': '#0b1f12',
      '--md-tertiary': '#3b6470', '--md-on-tertiary': '#ffffff',
      '--md-tertiary-container': '#bee9f7', '--md-on-tertiary-container': '#001f27',
      '--md-inverse-primary': '#8ed49a',
      '--md-surface': '#f5fbf3', '--md-surface-dim': '#d5dbd3',
      '--md-surface-bright': '#f5fbf3',
      '--md-surface-container-lowest': '#ffffff',
      '--md-surface-container-low': '#eff5ed',
      '--md-surface-container': '#e9efe7',
      '--md-surface-container-high': '#e4eae2',
      '--md-surface-container-highest': '#dee4dc',
      '--md-on-surface': '#181d19', '--md-on-surface-variant': '#414941',
      '--md-outline': '#717971', '--md-outline-variant': '#c0c9c0',
      '--md-inverse-surface': '#2d322e', '--md-inverse-on-surface': '#ecf2ea',
      '--md-footer-bg': '#e2eee3', '--md-footer-on-bg': '#182019',
    },
    dark: {
      '--md-primary': '#8ed49a', '--md-on-primary': '#003915',
      '--md-primary-container': '#005224', '--md-on-primary-container': '#a9f0b4',
      '--md-secondary': '#b5ccb9', '--md-on-secondary': '#213527',
      '--md-secondary-container': '#374b3d', '--md-on-secondary-container': '#d1e8d5',
      '--md-tertiary': '#a2cdd9', '--md-on-tertiary': '#01363f',
      '--md-tertiary-container': '#224d57', '--md-on-tertiary-container': '#bee9f7',
      '--md-inverse-primary': '#1a6b2f',
      '--md-surface': '#101510', '--md-surface-dim': '#101510',
      '--md-surface-bright': '#353b34',
      '--md-surface-container-lowest': '#0b100b',
      '--md-surface-container-low': '#181d18',
      '--md-surface-container': '#1c221c',
      '--md-surface-container-high': '#272d27',
      '--md-surface-container-highest': '#323832',
      '--md-on-surface': '#dfe5de', '--md-on-surface-variant': '#bdc9bc',
      '--md-outline': '#878f87', '--md-outline-variant': '#404940',
      '--md-inverse-surface': '#dde4db', '--md-inverse-on-surface': '#1a2019',
      '--md-footer-bg': '#0d160e', '--md-footer-on-bg': '#d8f0da',
    }
  },
  {
    id: 'violet', name: 'Фіолетовий', swatch: '#6750a4',
    light: {
      '--md-primary': '#6750a4', '--md-on-primary': '#ffffff',
      '--md-primary-container': '#eaddff', '--md-on-primary-container': '#21005d',
      '--md-secondary': '#625b71', '--md-on-secondary': '#ffffff',
      '--md-secondary-container': '#e8def8', '--md-on-secondary-container': '#1d192b',
      '--md-tertiary': '#7d5260', '--md-on-tertiary': '#ffffff',
      '--md-tertiary-container': '#ffd8e4', '--md-on-tertiary-container': '#31111d',
      '--md-inverse-primary': '#cfbcff',
      '--md-surface': '#fffbff', '--md-surface-dim': '#ddd8e2',
      '--md-surface-bright': '#fffbff',
      '--md-surface-container-lowest': '#ffffff',
      '--md-surface-container-low': '#f7f2fb',
      '--md-surface-container': '#f2edf5',
      '--md-surface-container-high': '#ece7f0',
      '--md-surface-container-highest': '#e6e1ea',
      '--md-on-surface': '#1d1a22', '--md-on-surface-variant': '#49454f',
      '--md-outline': '#7a7582', '--md-outline-variant': '#cac4cf',
      '--md-inverse-surface': '#322f37', '--md-inverse-on-surface': '#f5eff7',
      '--md-footer-bg': '#ede7f6', '--md-footer-on-bg': '#231b2f',
    },
    dark: {
      '--md-primary': '#cfbcff', '--md-on-primary': '#381e72',
      '--md-primary-container': '#4f378b', '--md-on-primary-container': '#eaddff',
      '--md-secondary': '#ccc2dc', '--md-on-secondary': '#332d41',
      '--md-secondary-container': '#4a4458', '--md-on-secondary-container': '#e8def8',
      '--md-tertiary': '#efb8c8', '--md-on-tertiary': '#4a2532',
      '--md-tertiary-container': '#633b48', '--md-on-tertiary-container': '#ffd8e4',
      '--md-inverse-primary': '#6750a4',
      '--md-surface': '#141218', '--md-surface-dim': '#141218',
      '--md-surface-bright': '#3b383e',
      '--md-surface-container-lowest': '#0f0d13',
      '--md-surface-container-low': '#1d1a21',
      '--md-surface-container': '#211e25',
      '--md-surface-container-high': '#2b2930',
      '--md-surface-container-highest': '#36343b',
      '--md-on-surface': '#e6e1e9', '--md-on-surface-variant': '#cac4d0',
      '--md-outline': '#938f99', '--md-outline-variant': '#49454f',
      '--md-inverse-surface': '#e6e1e9', '--md-inverse-on-surface': '#322f37',
      '--md-footer-bg': '#110e18', '--md-footer-on-bg': '#e8dcff',
    }
  },
  {
    id: 'rose', name: 'Рожевий', swatch: '#b4004e',
    light: {
      '--md-primary': '#b4004e', '--md-on-primary': '#ffffff',
      '--md-primary-container': '#ffd9e1', '--md-on-primary-container': '#3e0017',
      '--md-secondary': '#74565f', '--md-on-secondary': '#ffffff',
      '--md-secondary-container': '#ffd9e1', '--md-on-secondary-container': '#2b151c',
      '--md-tertiary': '#7c5635', '--md-on-tertiary': '#ffffff',
      '--md-tertiary-container': '#ffdcc1', '--md-on-tertiary-container': '#2d1600',
      '--md-inverse-primary': '#ffb1c3',
      '--md-surface': '#fffbff', '--md-surface-dim': '#e3d7da',
      '--md-surface-bright': '#fffbff',
      '--md-surface-container-lowest': '#ffffff',
      '--md-surface-container-low': '#fef0f3',
      '--md-surface-container': '#f8eaed',
      '--md-surface-container-high': '#f2e4e8',
      '--md-surface-container-highest': '#ecdfe2',
      '--md-on-surface': '#211a1c', '--md-on-surface-variant': '#4e4042',
      '--md-outline': '#7f6c6f', '--md-outline-variant': '#d4c3c5',
      '--md-inverse-surface': '#372024', '--md-inverse-on-surface': '#faedf0',
      '--md-footer-bg': '#f5e0e4', '--md-footer-on-bg': '#2b1316',
    },
    dark: {
      '--md-primary': '#ffb1c3', '--md-on-primary': '#63002a',
      '--md-primary-container': '#8c003f', '--md-on-primary-container': '#ffd9e1',
      '--md-secondary': '#e2bdc6', '--md-on-secondary': '#422930',
      '--md-secondary-container': '#5a3f47', '--md-on-secondary-container': '#ffd9e1',
      '--md-tertiary': '#f0bc91', '--md-on-tertiary': '#46290a',
      '--md-tertiary-container': '#5f3e1f', '--md-on-tertiary-container': '#ffdcc1',
      '--md-inverse-primary': '#b4004e',
      '--md-surface': '#1a1112', '--md-surface-dim': '#1a1112',
      '--md-surface-bright': '#413738',
      '--md-surface-container-lowest': '#140b0c',
      '--md-surface-container-low': '#221a1b',
      '--md-surface-container': '#271e1f',
      '--md-surface-container-high': '#322829',
      '--md-surface-container-highest': '#3d3334',
      '--md-on-surface': '#eddfe1', '--md-on-surface-variant': '#d3bcbe',
      '--md-outline': '#9c8589', '--md-outline-variant': '#524345',
      '--md-inverse-surface': '#eddfe1', '--md-inverse-on-surface': '#372024',
      '--md-footer-bg': '#150d0e', '--md-footer-on-bg': '#f7d8de',
    }
  },
  {
    id: 'orange', name: 'Помаранчевий', swatch: '#904d00',
    light: {
      '--md-primary': '#904d00', '--md-on-primary': '#ffffff',
      '--md-primary-container': '#ffdcbe', '--md-on-primary-container': '#2e1500',
      '--md-secondary': '#715b41', '--md-on-secondary': '#ffffff',
      '--md-secondary-container': '#fddcbb', '--md-on-secondary-container': '#271804',
      '--md-tertiary': '#56634a', '--md-on-tertiary': '#ffffff',
      '--md-tertiary-container': '#d9e8c8', '--md-on-tertiary-container': '#141e0c',
      '--md-inverse-primary': '#ffb870',
      '--md-surface': '#fff8f5', '--md-surface-dim': '#e2d8d0',
      '--md-surface-bright': '#fff8f5',
      '--md-surface-container-lowest': '#ffffff',
      '--md-surface-container-low': '#fcf2ea',
      '--md-surface-container': '#f6ece4',
      '--md-surface-container-high': '#f0e6de',
      '--md-surface-container-highest': '#ebe0d9',
      '--md-on-surface': '#211a13', '--md-on-surface-variant': '#4f4539',
      '--md-outline': '#81715f', '--md-outline-variant': '#d5c4b1',
      '--md-inverse-surface': '#372821', '--md-inverse-on-surface': '#fceee3',
      '--md-footer-bg': '#f3dfc9', '--md-footer-on-bg': '#2c1a04',
    },
    dark: {
      '--md-primary': '#ffb870', '--md-on-primary': '#4d2700',
      '--md-primary-container': '#6c3a00', '--md-on-primary-container': '#ffdcbe',
      '--md-secondary': '#e0c1a0', '--md-on-secondary': '#3f2d17',
      '--md-secondary-container': '#57432b', '--md-on-secondary-container': '#fddcbb',
      '--md-tertiary': '#bfcbaf', '--md-on-tertiary': '#293520',
      '--md-tertiary-container': '#3f4c35', '--md-on-tertiary-container': '#d9e8c8',
      '--md-inverse-primary': '#904d00',
      '--md-surface': '#1a110b', '--md-surface-dim': '#1a110b',
      '--md-surface-bright': '#413731',
      '--md-surface-container-lowest': '#140c06',
      '--md-surface-container-low': '#231913',
      '--md-surface-container': '#271d17',
      '--md-surface-container-high': '#322722',
      '--md-surface-container-highest': '#3d322c',
      '--md-on-surface': '#eedfd5', '--md-on-surface-variant': '#d1c0b3',
      '--md-outline': '#9a8679', '--md-outline-variant': '#504540',
      '--md-inverse-surface': '#eedfd5', '--md-inverse-on-surface': '#372820',
      '--md-footer-bg': '#140e07', '--md-footer-on-bg': '#ffdbb9',
    }
  },
  {
    id: 'teal', name: 'Бірюзовий', swatch: '#006875',
    light: {
      '--md-primary': '#006875', '--md-on-primary': '#ffffff',
      '--md-primary-container': '#97f0ff', '--md-on-primary-container': '#001f24',
      '--md-secondary': '#4a6267', '--md-on-secondary': '#ffffff',
      '--md-secondary-container': '#cde7ed', '--md-on-secondary-container': '#051f23',
      '--md-tertiary': '#525e7d', '--md-on-tertiary': '#ffffff',
      '--md-tertiary-container': '#dae2ff', '--md-on-tertiary-container': '#0d1b36',
      '--md-inverse-primary': '#4fd8eb',
      '--md-surface': '#f5fafb', '--md-surface-dim': '#d3d9da',
      '--md-surface-bright': '#f5fafb',
      '--md-surface-container-lowest': '#ffffff',
      '--md-surface-container-low': '#eff4f5',
      '--md-surface-container': '#e9eef0',
      '--md-surface-container-high': '#e3e9ea',
      '--md-surface-container-highest': '#dde3e4',
      '--md-on-surface': '#171d1e', '--md-on-surface-variant': '#3f484a',
      '--md-outline': '#6f797a', '--md-outline-variant': '#bec8ca',
      '--md-inverse-surface': '#2b3133', '--md-inverse-on-surface': '#edf3f4',
      '--md-footer-bg': '#dceef1', '--md-footer-on-bg': '#152124',
    },
    dark: {
      '--md-primary': '#4fd8eb', '--md-on-primary': '#00363d',
      '--md-primary-container': '#004e58', '--md-on-primary-container': '#97f0ff',
      '--md-secondary': '#b1cbcf', '--md-on-secondary': '#1b3438',
      '--md-secondary-container': '#324b4f', '--md-on-secondary-container': '#cde7ed',
      '--md-tertiary': '#bac6ea', '--md-on-tertiary': '#242f4d',
      '--md-tertiary-container': '#3b4664', '--md-on-tertiary-container': '#dae2ff',
      '--md-inverse-primary': '#006875',
      '--md-surface': '#0e1415', '--md-surface-dim': '#0e1415',
      '--md-surface-bright': '#333a3b',
      '--md-surface-container-lowest': '#090f10',
      '--md-surface-container-low': '#171d1e',
      '--md-surface-container': '#1b2122',
      '--md-surface-container-high': '#252b2d',
      '--md-surface-container-highest': '#303738',
      '--md-on-surface': '#dce4e5', '--md-on-surface-variant': '#bec8ca',
      '--md-outline': '#88929a', '--md-outline-variant': '#3f484a',
      '--md-inverse-surface': '#dce4e5', '--md-inverse-on-surface': '#2b3133',
      '--md-footer-bg': '#091417', '--md-footer-on-bg': '#d1f5f9',
    }
  },
  {
    id: 'red', name: 'Червоний', swatch: '#ba1a1a',
    light: {
      '--md-primary': '#ba1a1a', '--md-on-primary': '#ffffff',
      '--md-primary-container': '#ffdad6', '--md-on-primary-container': '#410002',
      '--md-secondary': '#775651', '--md-on-secondary': '#ffffff',
      '--md-secondary-container': '#ffdad6', '--md-on-secondary-container': '#2c1512',
      '--md-tertiary': '#755a2f', '--md-on-tertiary': '#ffffff',
      '--md-tertiary-container': '#ffdea9', '--md-on-tertiary-container': '#261900',
      '--md-inverse-primary': '#ffb4ab',
      '--md-surface': '#fffbff', '--md-surface-dim': '#e3d8d7',
      '--md-surface-bright': '#fffbff',
      '--md-surface-container-lowest': '#ffffff',
      '--md-surface-container-low': '#fef0ef',
      '--md-surface-container': '#f8eae9',
      '--md-surface-container-high': '#f2e4e4',
      '--md-surface-container-highest': '#ecdede',
      '--md-on-surface': '#211918', '--md-on-surface-variant': '#4e4040',
      '--md-outline': '#7f7170', '--md-outline-variant': '#d4c4c3',
      '--md-inverse-surface': '#382020', '--md-inverse-on-surface': '#faeede',
      '--md-footer-bg': '#f5dfde', '--md-footer-on-bg': '#2c1314',
    },
    dark: {
      '--md-primary': '#ffb4ab', '--md-on-primary': '#690005',
      '--md-primary-container': '#93000a', '--md-on-primary-container': '#ffdad6',
      '--md-secondary': '#e7bdb8', '--md-on-secondary': '#442926',
      '--md-secondary-container': '#5d3f3b', '--md-on-secondary-container': '#ffdad6',
      '--md-tertiary': '#e5c18c', '--md-on-tertiary': '#3d2d05',
      '--md-tertiary-container': '#554419', '--md-on-tertiary-container': '#ffdea9',
      '--md-inverse-primary': '#ba1a1a',
      '--md-surface': '#1a1110', '--md-surface-dim': '#1a1110',
      '--md-surface-bright': '#413837',
      '--md-surface-container-lowest': '#140b0b',
      '--md-surface-container-low': '#221a19',
      '--md-surface-container': '#271e1d',
      '--md-surface-container-high': '#322927',
      '--md-surface-container-highest': '#3d3332',
      '--md-on-surface': '#eddede', '--md-on-surface-variant': '#d4bcbc',
      '--md-outline': '#9c8686', '--md-outline-variant': '#524545',
      '--md-inverse-surface': '#eddede', '--md-inverse-on-surface': '#382020',
      '--md-footer-bg': '#160d0d', '--md-footer-on-bg': '#f7d5d4',
    }
  },
  {
    id: 'indigo', name: 'Індіго', swatch: '#3b49df',
    light: {
      '--md-primary': '#3b49df', '--md-on-primary': '#ffffff',
      '--md-primary-container': '#e0e0ff', '--md-on-primary-container': '#01006e',
      '--md-secondary': '#5c5d72', '--md-on-secondary': '#ffffff',
      '--md-secondary-container': '#e1e0f9', '--md-on-secondary-container': '#191a2c',
      '--md-tertiary': '#78536a', '--md-on-tertiary': '#ffffff',
      '--md-tertiary-container': '#ffd8ee', '--md-on-tertiary-container': '#2e1126',
      '--md-inverse-primary': '#bec2ff',
      '--md-surface': '#fdfbff', '--md-surface-dim': '#dcd9e7',
      '--md-surface-bright': '#fdfbff',
      '--md-surface-container-lowest': '#ffffff',
      '--md-surface-container-low': '#f6f3ff',
      '--md-surface-container': '#f1eef9',
      '--md-surface-container-high': '#ebe8f3',
      '--md-surface-container-highest': '#e5e3ee',
      '--md-on-surface': '#1b1b22', '--md-on-surface-variant': '#45464e',
      '--md-outline': '#767580', '--md-outline-variant': '#c6c5d0',
      '--md-inverse-surface': '#303038', '--md-inverse-on-surface': '#f3f0f9',
      '--md-footer-bg': '#e6e5f8', '--md-footer-on-bg': '#1e1d32',
    },
    dark: {
      '--md-primary': '#bec2ff', '--md-on-primary': '#0300ac',
      '--md-primary-container': '#1e1fb2', '--md-on-primary-container': '#e0e0ff',
      '--md-secondary': '#c5c4dd', '--md-on-secondary': '#2e2f42',
      '--md-secondary-container': '#454559', '--md-on-secondary-container': '#e1e0f9',
      '--md-tertiary': '#e8b9d5', '--md-on-tertiary': '#45263c',
      '--md-tertiary-container': '#5e3c54', '--md-on-tertiary-container': '#ffd8ee',
      '--md-inverse-primary': '#3b49df',
      '--md-surface': '#131318', '--md-surface-dim': '#131318',
      '--md-surface-bright': '#39383f',
      '--md-surface-container-lowest': '#0e0e13',
      '--md-surface-container-low': '#1b1b21',
      '--md-surface-container': '#1f1f26',
      '--md-surface-container-high': '#2a2930',
      '--md-surface-container-highest': '#35343b',
      '--md-on-surface': '#e5e2eb', '--md-on-surface-variant': '#c6c5d0',
      '--md-outline': '#908f9a', '--md-outline-variant': '#45464e',
      '--md-inverse-surface': '#e5e2eb', '--md-inverse-on-surface': '#303038',
      '--md-footer-bg': '#100f1e', '--md-footer-on-bg': '#dddaff',
    }
  },
];

const DEFAULT_ACCENT_ID = 'blue';

function getStoredAccent() {
  return localStorage.getItem(ACCENT_STORAGE_KEY) || DEFAULT_ACCENT_ID;
}

function applyAccent(paletteId, { persist = false } = {}) {
  const palette = ACCENT_PALETTES.find(p => p.id === paletteId) || ACCENT_PALETTES[0];
  const isDark = document.documentElement.dataset.theme === 'dark';
  const tokens = isDark ? palette.dark : palette.light;
  const root = document.documentElement;

  // Apply ALL tokens (includes surface + primary + secondary + tertiary)
  Object.entries(tokens).forEach(([prop, val]) => {
    root.style.setProperty(prop, val);
  });

  root.dataset.accent = paletteId;
  if (persist) localStorage.setItem(ACCENT_STORAGE_KEY, paletteId);

  // Refresh swatch active states (desktop + mobile)
  document.querySelectorAll('.accent-swatch').forEach(el => {
    el.classList.toggle('active', el.dataset.accent === paletteId);
  });
}

function buildSwatchesHTML(currentId) {
  return ACCENT_PALETTES.map(p => `
    <button
      class="accent-swatch${p.id === currentId ? ' active' : ''}"
      data-accent="${p.id}"
      title="${p.name}"
      aria-label="${p.name}"
      style="--swatch-color: ${p.swatch}"
      onclick="selectAccent('${p.id}')"
    ></button>
  `).join('');
}

function initAccentSwatches() {
  const currentId = getStoredAccent();
  const container = document.getElementById('accent-swatches');
  if (container) container.innerHTML = buildSwatchesHTML(currentId);
  const containerMobile = document.getElementById('accent-swatches-mobile');
  if (containerMobile) containerMobile.innerHTML = buildSwatchesHTML(currentId);
}

function selectAccent(id) {
  applyAccent(id, { persist: true });
}

function toggleAccentPicker(e) {
  e.stopPropagation();
  const popup = document.getElementById('accent-popup');
  if (popup) popup.classList.toggle('open');
}

function toggleAccentPickerMobile(e) {
  e.stopPropagation();
  const popup = document.getElementById('accent-popup-mobile');
  if (popup) popup.classList.toggle('open');
}

// Close accent popups when clicking outside
document.addEventListener('click', (e) => {
  const popup = document.getElementById('accent-popup');
  if (popup && popup.classList.contains('open') && !e.target.closest('.accent-picker-wrap')) {
    popup.classList.remove('open');
  }
  const popupMobile = document.getElementById('accent-popup-mobile');
  if (popupMobile && popupMobile.classList.contains('open') && !e.target.closest('.accent-picker-wrap')) {
    popupMobile.classList.remove('open');
  }
});

function initAccent() {
  applyAccent(getStoredAccent());
  // Re-apply when theme switches (dark/light tokens differ)
  new MutationObserver(() => applyAccent(getStoredAccent()))
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

initAccent();

// ============ ICON FONT READY ============
if (document.fonts && document.fonts.load) {
  document.fonts.load("24px 'Material Symbols Rounded'")
    .then(() => document.documentElement.classList.add('icons-ready'))
    .catch(() => document.documentElement.classList.add('icons-ready'));
} else {
  document.documentElement.classList.add('icons-ready');
}

// ============ MOBILE NAV ============
function toggleNav() {
  const nav = document.getElementById('nav-links');
  if (nav) nav.classList.toggle('open');
}

document.addEventListener('click', function (e) {
  const nav = document.getElementById('nav-links');
  const toggle = document.querySelector('.mobile-toggle');
  if (nav && toggle && nav.classList.contains('open') &&
    !nav.contains(e.target) && !toggle.contains(e.target)) {
    nav.classList.remove('open');
  }
});

// Double-click on theme toggle resets to system theme
document.addEventListener('dblclick', function (e) {
  if (e.target.closest('.theme-toggle')) {
    e.preventDefault();
    resetThemeToAuto();
  }
});

// ============ SCROLL REVEAL ANIMATIONS ============
function initScrollReveal() {
  const elements = document.querySelectorAll('[data-reveal]');
  if (!elements.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    elements.forEach(el => el.classList.add('revealed'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const siblings = entry.target.parentElement.querySelectorAll('[data-reveal]');
        let siblingIndex = 0;
        siblings.forEach((sib, i) => { if (sib === entry.target) siblingIndex = i; });
        entry.target.style.transitionDelay = `${siblingIndex * 80}ms`;
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => observer.observe(el));
}

// ============ HEADER SCROLL EFFECT ============
function initHeaderScroll() {
  const header = document.querySelector('header');
  if (!header) return;

  const mobileQuery = window.matchMedia('(max-width: 768px)');
  const headerControls = document.querySelector('.floating-controls');
  let lastScroll = 0;
  let ticking = false;

  function setHeaderTransform(hidden) {
    if (mobileQuery.matches) {
      header.style.removeProperty('transform');
      return;
    }
    header.style.transform = hidden
      ? 'translateX(-50%) translateY(-120%)'
      : 'translateX(-50%) translateY(0)';
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        if (mobileQuery.matches) {
          const scrollY = window.scrollY;
          if (headerControls) {
            headerControls.classList.toggle('is-hidden', scrollY > 24);
          }
          header.style.removeProperty('transform');
          lastScroll = scrollY;
          ticking = false;
          return;
        }

        const scrollY = window.scrollY;
        if (headerControls) {
          headerControls.classList.remove('is-hidden');
        }
        header.classList.toggle('scrolled', scrollY > 80);
        setHeaderTransform(scrollY > lastScroll && scrollY > 200);
        lastScroll = scrollY;
        ticking = false;
      });
      ticking = true;
    }
  });

  mobileQuery.addEventListener('change', () => {
    setHeaderTransform(false);
    if (headerControls) {
      headerControls.classList.toggle('is-hidden', mobileQuery.matches && window.scrollY > 24);
    }
  });

  if (headerControls) {
    headerControls.classList.toggle('is-hidden', mobileQuery.matches && window.scrollY > 24);
  }
}

// ============ PROJECT FILTERING ============
function filterProjects(category) {
  const cards = document.querySelectorAll('.project-card');
  const btns = document.querySelectorAll('.filter-btn');

  btns.forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');

  cards.forEach(card => {
    const cat = card.dataset.category;
    if (category === 'усі' || cat === category) {
      card.style.display = '';
      card.style.animation = 'fade-up 0.4s cubic-bezier(0.05,0.7,0.1,1) forwards';
    } else {
      card.style.display = 'none';
    }
  });
}

// ============ DONATE AMOUNT SELECTION ============
document.addEventListener('click', function (e) {
  if (e.target.closest('.amount-btn')) {
    const btn = e.target.closest('.amount-btn');
    document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    const amount = btn.dataset.amount;
    const customInput = document.getElementById('customAmount') || document.getElementById('custom-amount');
    if (customInput && amount) customInput.value = amount;
  }
});

// ============ COUNTER ANIMATION ============
function animateCounters() {
  const counters = document.querySelectorAll('.stat-card h3');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const text = el.textContent;
        const match = text.match(/^(\d+)/);
        if (!match) return;

        const target = parseInt(match[1]);
        const suffix = text.replace(match[1], '');
        let current = 0;
        const step = Math.max(1, Math.floor(target / 30));
        const duration = 800;
        const interval = duration / (target / step);

        const timer = setInterval(() => {
          current += step;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          el.textContent = current + suffix;
        }, interval);

        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

// ============ SMOOTH SCROLL ============
document.addEventListener('click', function (e) {
  const link = e.target.closest('a[href*="#"]');
  if (link) {
    const hash = link.getAttribute('href').split('#')[1];
    if (hash) {
      const target = document.getElementById(hash);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }
});

// ============ INIT ============
document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  initHeaderScroll();
  animateCounters();
  initAccentSwatches();
});
