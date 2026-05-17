import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scrollTo } from './smooth-scroll.js';

gsap.registerPlugin(ScrollTrigger);

const SUBTITLE_TEXT = 'AI Developer · LLM Engineer · Systems Builder';

export function splitHeroTitle() {
  const lines = document.querySelectorAll('.hero__title [data-split]');
  lines.forEach((line) => {
    const text = line.textContent;
    line.textContent = '';
    text.split('').forEach((char) => {
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = char === ' ' ? '\u00A0' : char;
      line.appendChild(span);
    });
  });
}

export function typeSubtitle(el) {
  if (!el) return;
  let i = 0;
  const tick = () => {
    if (i <= SUBTITLE_TEXT.length) {
      el.textContent = SUBTITLE_TEXT.slice(0, i);
      i++;
      setTimeout(tick, i === SUBTITLE_TEXT.length ? 400 : 45);
    } else {
      el.classList.add('is-done');
    }
  };
  setTimeout(tick, 900);
}

export function initHeroAnimations() {
  const chars = document.querySelectorAll('.hero__title .char');
  const tl = gsap.timeline({ delay: 0.15 });

  tl.to('.site-nav', { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' })
    .to('.hero__eyebrow', { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.5');

  if (chars.length) {
    tl.to(
      chars,
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        stagger: 0.025,
        ease: 'power4.out',
      },
      '-=0.4'
    );
  }

  tl.to('#hero-cta', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.3').to(
    '.hero__scroll-hint',
    { opacity: 1, duration: 0.6 },
    '-=0.2'
  );
}

export function initNav(lenis) {
  document.querySelectorAll('.site-nav a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const id = link.getAttribute('href');
      const target = document.querySelector(id);
      scrollTo(target, lenis);
    });
  });

  const sections = ['#hero', '#about', '#projects', '#skills', '#contact'];
  sections.forEach((id) => {
    const el = document.querySelector(id);
    if (!el) return;
    ScrollTrigger.create({
      trigger: el,
      start: 'top 55%',
      end: 'bottom 45%',
      onToggle: (self) => {
        if (self.isActive) {
          document.querySelectorAll('.site-nav__link').forEach((a) => {
            a.classList.toggle('is-active', a.getAttribute('href') === id);
          });
        }
      },
    });
  });
}

export function initScrollAnimations({ isMobile = false } = {}) {
  const revealDefaults = {
    y: 36,
    opacity: 0,
    duration: 0.85,
    ease: 'power3.out',
  };

  gsap.utils.toArray('.section').forEach((section) => {
    const targets = section.querySelectorAll('.section__tag, .section__title, .section__text');
    if (!targets.length) return;

    gsap.from(targets, {
      ...revealDefaults,
      stagger: 0.08,
      scrollTrigger: {
        trigger: section,
        start: 'top 78%',
        once: true,
      },
    });
  });

  gsap.from('#about .about-object', {
    scale: 0.85,
    opacity: 0,
    duration: 1,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '#about',
      start: 'top 72%',
      once: true,
    },
  });

  const pills = document.querySelectorAll('.skill-pills span');
  if (pills.length) {
    gsap.from(pills, {
      y: 16,
      opacity: 0,
      duration: 0.45,
      stagger: 0.03,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '#skill-pills',
        start: 'top 82%',
        once: true,
      },
    });
  }

  const cards = document.querySelectorAll('.project-card');
  if (cards.length) {
    gsap.from(cards, {
      y: 48,
      opacity: 0,
      duration: 0.75,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '#projects',
        start: 'top 75%',
        once: true,
      },
    });
  }

  gsap.from('.skills-category', {
    y: 24,
    opacity: 0,
    duration: 0.65,
    stagger: 0.08,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.skills-categories',
      start: 'top 85%',
      once: true,
    },
  });

  gsap.from('.contact-panel', {
    y: 32,
    opacity: 0,
    duration: 0.9,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '#contact',
      start: 'top 78%',
      once: true,
    },
  });

  document.querySelectorAll('.glitch-text').forEach((el) => {
    if (el.dataset.glitchPlayed) return;
    ScrollTrigger.create({
      trigger: el,
      start: 'top 82%',
      once: true,
      onEnter: () => {
        if (el.dataset.glitchPlayed) return;
        el.dataset.glitchPlayed = 'true';
        el.classList.add('is-glitching');
        setTimeout(() => el.classList.remove('is-glitching'), 350);
      },
    });
  });

}

export function initHeroCTA(scrollFn) {
  const cta = document.getElementById('hero-cta');
  const about = document.getElementById('about');
  cta?.addEventListener('click', () => {
    if (scrollFn) scrollFn(about);
    else about?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

export function initContactForm() {
  const form = document.getElementById('contact-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button');
    const original = btn.textContent;
    btn.textContent = 'Transmission sent ✓';
    btn.disabled = true;
    gsap.fromTo(btn, { scale: 1 }, { scale: 1.03, duration: 0.2, yoyo: true, repeat: 1 });
    setTimeout(() => {
      btn.textContent = original;
      btn.disabled = false;
      form.reset();
    }, 3000);
  });
}
