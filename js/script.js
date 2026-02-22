/**
 * M3 Expressive — Interactive Script
 * Scroll reveal animations, theme toggle, mobile nav, filtering
 */

// ============ THEME TOGGLE ============
function getPreferredTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('theme', theme);

  // Update toggle icon if exists
  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
  }
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme || getPreferredTheme();
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

// Init theme on page load
applyTheme(getPreferredTheme());

// ============ MOBILE NAV ============
function toggleNav() {
  const nav = document.getElementById('nav-links');
  if (nav) nav.classList.toggle('open');
}

// Close mobile nav on click outside
document.addEventListener('click', function (e) {
  const nav = document.getElementById('nav-links');
  const toggle = document.querySelector('.mobile-toggle');
  if (nav && nav.classList.contains('open') && !nav.contains(e.target) && !toggle.contains(e.target)) {
    nav.classList.remove('open');
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

  let lastScroll = 0;
  let ticking = false;

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
        if (scrollY > lastScroll && scrollY > 200) {
          header.style.transform = 'translateX(-50%) translateY(-120%)';
        } else {
          header.style.transform = 'translateX(-50%) translateY(0)';
        }

        lastScroll = scrollY;
        ticking = false;
      });
      ticking = true;
    }
  });
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
    const customInput = document.getElementById('customAmount');
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
