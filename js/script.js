/**
 * M3 Expressive — Interactive Script
 * Scroll reveal animations, theme toggle, mobile nav, filtering
 */

// ============ THEME TOGGLE ============
const THEME_STORAGE_KEY = 'theme';
const THEME_MANUAL_KEY = 'theme_manual';
const systemDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');

function getStoredTheme() {
  if (localStorage.getItem(THEME_MANUAL_KEY) !== '1') {
    return null;
  }
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

  // Update toggle icon if exists
  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
  }
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

// Init theme on page load
function initTheme() {
  // Migration from older logic that always persisted theme.
  if (localStorage.getItem(THEME_MANUAL_KEY) !== '1') {
    localStorage.removeItem(THEME_STORAGE_KEY);
  }

  const stored = getStoredTheme();
  applyTheme(stored || getSystemTheme());

  // Follow system only while user has not selected a manual override.
  systemDarkQuery.addEventListener('change', () => {
    if (!getStoredTheme()) {
      applyTheme(getSystemTheme());
    }
  });
}

initTheme();

// Reveal icon ligatures only after icon font is ready.
if (document.fonts && document.fonts.load) {
  document.fonts.load("24px 'Material Symbols Rounded'").then(() => {
    document.documentElement.classList.add('icons-ready');
  }).catch(() => {
    document.documentElement.classList.add('icons-ready');
  });
} else {
  document.documentElement.classList.add('icons-ready');
}

// ============ MOBILE NAV ============
function toggleNav() {
  const nav = document.getElementById('nav-links');
  if (nav) nav.classList.toggle('open');
}

// Close mobile nav on click outside
document.addEventListener('click', function (e) {
  const nav = document.getElementById('nav-links');
  const toggle = document.querySelector('.mobile-toggle');
  if (nav && toggle && nav.classList.contains('open') && !nav.contains(e.target) && !toggle.contains(e.target)) {
    nav.classList.remove('open');
  }
});

// Double-click on the theme button resets to automatic mode (system theme).
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

  // Check for reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    elements.forEach(el => el.classList.add('revealed'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        // Stagger delay based on sibling position
        const siblings = entry.target.parentElement.querySelectorAll('[data-reveal]');
        let siblingIndex = 0;
        siblings.forEach((sib, i) => { if (sib === entry.target) siblingIndex = i; });

        entry.target.style.transitionDelay = `${siblingIndex * 80}ms`;
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  elements.forEach(el => observer.observe(el));
}

// ============ HEADER SCROLL EFFECT ============
function initHeaderScroll() {
  const header = document.querySelector('header');
  if (!header) return;

  const mobileQuery = window.matchMedia('(max-width: 768px)');
  let lastScroll = 0;
  let ticking = false;

  function setHeaderTransform(hidden) {
    if (mobileQuery.matches) {
      header.style.transform = hidden ? 'translateY(-120%)' : 'translateY(0)';
      return;
    }
    header.style.transform = hidden ? 'translateX(-50%) translateY(-120%)' : 'translateX(-50%) translateY(0)';
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;

        if (scrollY > 80) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }

        // Hide header on fast scroll down, show on scroll up
        setHeaderTransform(scrollY > lastScroll && scrollY > 200);

        lastScroll = scrollY;
        ticking = false;
      });
      ticking = true;
    }
  });

  mobileQuery.addEventListener('change', () => setHeaderTransform(false));
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
    if (customInput && amount) {
      customInput.value = amount;
    }
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
});
