export function triggerPreloaderBurst(canvas) {
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const particles = [];
  const colors = ['#00d4ff', '#8b5cf6', '#e8e8f0'];

  for (let i = 0; i < 120; i++) {
    const angle = (Math.PI * 2 * i) / 120 + Math.random() * 0.2;
    const speed = 2 + Math.random() * 6;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: 0.012 + Math.random() * 0.01,
      r: 1.5 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }

  let raf;
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = 0;

    particles.forEach((p) => {
      p.life -= p.decay;
      if (p.life <= 0) return;

      alive++;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.98;
      p.vy *= 0.98;

      const radius = Math.max(0, p.r * p.life);
      if (radius <= 0) return;

      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life * 0.85;
      ctx.fill();
    });

    ctx.globalAlpha = 1;
    if (alive > 0) {
      raf = requestAnimationFrame(draw);
    } else {
      canvas.classList.add('is-hidden');
    }
  };

  draw();
  return () => cancelAnimationFrame(raf);
}
