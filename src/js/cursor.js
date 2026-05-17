import gsap from 'gsap';

export function initCursor() {
  const cursor = document.getElementById('cursor');
  if (!cursor || window.matchMedia('(pointer: coarse)').matches) return null;

  const dot = cursor.querySelector('.cursor__dot');
  const ring = cursor.querySelector('.cursor__ring');
  const trails = [];

  for (let i = 0; i < 3; i++) {
    const t = document.createElement('div');
    t.className = 'cursor__trail';
    cursor.appendChild(t);
    trails.push(t);
  }

  const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const target = { ...pos };

  document.addEventListener('mousemove', (e) => {
    target.x = e.clientX;
    target.y = e.clientY;
  });

  const hoverables = document.querySelectorAll(
    'a, button, [data-cursor="hover"], .project-card, .contact-icon, .btn'
  );
  hoverables.forEach((el) => {
    el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
  });

  document.querySelectorAll('.magnetic').forEach((el) => {
    if (el.closest('.site-nav')) return;

    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(el, { x: x * 0.15, y: y * 0.15, duration: 0.35, ease: 'power2.out' });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.4, ease: 'power2.out' });
    });
  });

  function tick() {
    pos.x += (target.x - pos.x) * 0.2;
    pos.y += (target.y - pos.y) * 0.2;

    gsap.set(dot, { x: pos.x, y: pos.y });
    gsap.set(ring, { x: pos.x, y: pos.y });

    trails.forEach((trail, i) => {
      const follow = 0.12 + i * 0.06;
      const tx = pos.x + (target.x - pos.x) * follow;
      const ty = pos.y + (target.y - pos.y) * follow;
      gsap.set(trail, {
        x: tx,
        y: ty,
        opacity: 0.25 - i * 0.06,
      });
    });

    requestAnimationFrame(tick);
  }

  tick();
  return cursor;
}
