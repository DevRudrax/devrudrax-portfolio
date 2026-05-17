import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let lenisInstance = null;
let onScrollCallback = null;

export function initSmoothScroll({ onScroll } = {}) {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(pointer: coarse)').matches;

  if (prefersReduced || isTouch) {
    if (onScroll) {
      const nativeScroll = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? window.scrollY / max : 0;
        onScroll(p);
        ScrollTrigger.update();
      };
      window.addEventListener('scroll', nativeScroll, { passive: true });
      nativeScroll();
    }
    return null;
  }

  onScrollCallback = onScroll;

  const lenis = new Lenis({
    lerp: 0.085,
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.5,
    infinite: false,
  });

  lenis.on('scroll', () => {
    ScrollTrigger.update();
    onScrollCallback?.(lenis.progress);
  });

  gsap.ticker.add(() => {
    lenis.raf(performance.now());
  });
  gsap.ticker.lagSmoothing(0);

  lenisInstance = lenis;

  window.addEventListener('resize', () => {
    lenis.resize();
    ScrollTrigger.refresh();
  });

  return lenis;
}

export function getLenis() {
  return lenisInstance;
}

export function scrollTo(target, lenis = lenisInstance) {
  if (!target) return;

  if (lenis) {
    lenis.scrollTo(target, { offset: -88, duration: 1.2 });
    return;
  }

  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function destroySmoothScroll() {
  if (!lenisInstance) return;
  lenisInstance.destroy();
  lenisInstance = null;
}
