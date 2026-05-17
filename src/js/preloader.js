import gsap from 'gsap';
import { triggerPreloaderBurst } from './preloader-burst.js';

function finishPreloader(preloader, onComplete) {
  preloader?.classList.add('is-done');
  document.body.classList.add('is-loaded');
  document.body.style.overflow = '';
  onComplete?.();
}

export function runPreloader(onComplete) {
  const preloader = document.getElementById('preloader');
  const progress = document.getElementById('preloader-progress');
  const letters = document.querySelectorAll('.preloader__letter');
  const burstCanvas = document.getElementById('preloader-burst');

  if (!preloader) {
    document.body.classList.add('is-loaded');
    onComplete?.();
    return;
  }

  document.body.style.overflow = 'hidden';

  const safetyTimer = window.setTimeout(() => {
    finishPreloader(preloader, onComplete);
  }, 4500);

  if (burstCanvas) {
    burstCanvas.width = window.innerWidth;
    burstCanvas.height = window.innerHeight;
  }

  const dismiss = () => {
    window.clearTimeout(safetyTimer);
    try {
      triggerPreloaderBurst(burstCanvas);
    } catch (err) {
      console.warn('Preloader burst skipped:', err);
    }

    gsap.to(preloader, {
      opacity: 0,
      duration: 0.7,
      delay: 0.2,
      ease: 'power2.inOut',
      onComplete: () => finishPreloader(preloader, onComplete),
    });
  };

  if (!letters.length || !progress) {
    dismiss();
    return;
  }

  const tl = gsap.timeline({ onComplete: dismiss });

  tl.to(letters, {
    opacity: 1,
    y: 0,
    duration: 0.6,
    stagger: 0.12,
    ease: 'power3.out',
  }).to(
    progress,
    {
      width: '100%',
      duration: 1.4,
      ease: 'power2.inOut',
    },
    '-=0.2'
  );
}
