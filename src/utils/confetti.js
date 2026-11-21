// Zero-dependency pure Canvas Confetti trigger

export default function triggerConfetti({ particleCount = 50, spread = 60 } = {}) {
  try {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.append(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#2dd4bf', '#14b8a6', '#10b981', '#38bdf8', '#fbbf24', '#f43f5e'];
    const particles = [];

    // `spread` widens the horizontal dispersion of the burst.
    const spreadFactor = Math.max(0.2, spread / 60);

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 200 * spreadFactor,
        y: canvas.height * 0.6,
        vx: (Math.random() - 0.5) * 12 * spreadFactor,
        vy: -Math.random() * 14 - 6,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10,
        alpha: 1
      });
    }

    let frame = 0;
    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.4; // gravity
        p.rotation += p.vRot;
        p.alpha -= 0.015;

        if (p.alpha > 0) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
          ctx.restore();
        }
      }

      frame++;
      if (alive && frame < 90) {
        requestAnimationFrame(render);
      } else {
        canvas.remove();
      }
    }
    render();
  } catch (e) {
    console.warn('Confetti trigger skipped:', e);
  }
}

