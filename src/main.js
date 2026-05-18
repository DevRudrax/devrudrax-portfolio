import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { NeuralScene } from './js/neural-scene.js';
import { AboutMesh } from './js/about-mesh.js';
import { SkillsOrbit } from './js/skills-orbit.js';
import { initCursor } from './js/cursor.js';
import { runPreloader } from './js/preloader.js';
import { initTiltCards } from './js/tilt.js';
import { initFooterParticles } from './js/footer-particles.js';
import { initSmoothScroll, scrollTo } from './js/smooth-scroll.js';
import {
  splitHeroTitle,
  typeSubtitle,
  initHeroAnimations,
  initScrollAnimations,
  initHeroCTA,
  initContactForm,
  initNav,
} from './js/animations.js';

gsap.registerPlugin(ScrollTrigger);

const isMobile = window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;
if (isMobile) document.body.classList.add('is-mobile');

let neuralScene;
let aboutMesh;
let skillsOrbit;
let lenis;
let scrollSection = 0;

function handleScrollProgress(p) {
  scrollSection = p * 4;
  neuralScene?.setScrollProgress(p);
  const bar = document.getElementById('scroll-progress');
  if (bar) bar.style.transform = `scaleX(${p})`;
}

function initThree() {
  const canvas = document.getElementById('webgl');
  if (!canvas) return;

  if (isMobile) canvas.classList.add('is-reduced');

  neuralScene = new NeuralScene(canvas, { reduced: isMobile });

  const aboutContainer = document.getElementById('about-object');
  if (aboutContainer && !isMobile) {
    aboutMesh = new AboutMesh(aboutContainer);

    ScrollTrigger.create({
      trigger: '#about',
      start: 'top bottom',
      end: 'bottom top',
      onEnter: () => aboutMesh?.setActive(true),
      onLeave: () => aboutMesh?.setActive(false),
      onEnterBack: () => aboutMesh?.setActive(true),
      onLeaveBack: () => aboutMesh?.setActive(false),
    });
  }

  const skillsCanvas = document.getElementById('skills-canvas');
  if (skillsCanvas) {
    try {
      skillsOrbit = new SkillsOrbit(skillsCanvas);

      ScrollTrigger.create({
        trigger: '#skills',
        start: 'top bottom',
        end: 'bottom top',
        onEnter: () => skillsOrbit?.setActive(true),
        onLeave: () => skillsOrbit?.setActive(false),
        onEnterBack: () => skillsOrbit?.setActive(true),
        onLeaveBack: () => skillsOrbit?.setActive(false),
      });
    } catch (err) {
      console.warn('SkillsOrbit WebGL initialization failed, using 2D fallback:', err);
      const wrap = document.getElementById('skills-canvas-wrap');
      if (wrap) {
        wrap.innerHTML = [
          '<div class="skills-fallback">',
          '<div class="skills-fallback__core"></div>',
          '<p class="skills-fallback__text">Neural orbit · optimized view</p>',
          '</div>',
        ].join('');
      }
    }
  }
}

function animate() {
  requestAnimationFrame(animate);

  neuralScene?.updateCameraFromScroll(scrollSection / 4);
  neuralScene?.render();
  aboutMesh?.render();
  if (skillsOrbit?.isActive) skillsOrbit.render();
}

function bootstrap() {
  splitHeroTitle();
  initCursor();
  initTiltCards();
  initHeroCTA((target) => scrollTo(target, lenis));
  initContactForm();
  initNav(lenis);
  initFooterParticles(document.getElementById('footer-particles'));

  initScrollAnimations({ isMobile });

  typeSubtitle(document.getElementById('hero-subtitle'));
  initHeroAnimations();
  animate();

  requestAnimationFrame(() => ScrollTrigger.refresh(true));
}

runPreloader(() => {
  try {
    lenis = initSmoothScroll({ onScroll: handleScrollProgress });
  } catch (err) {
    console.warn('Smooth scroll disabled:', err);
    lenis = null;
    window.addEventListener(
      'scroll',
      () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        handleScrollProgress(max > 0 ? window.scrollY / max : 0);
      },
      { passive: true }
    );
  }

  try {
    initThree();
    bootstrap();
    if (lenis) lenis.resize();
    ScrollTrigger.refresh(true);
  } catch (err) {
    console.error('Portfolio init failed:', err);
    document.body.classList.add('is-loaded');
  }
});
