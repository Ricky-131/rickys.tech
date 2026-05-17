// ── CURSOR (desktop/mouse only) ──
const cursor = document.getElementById('cursor');
const trail  = document.getElementById('cursor-trail');

if (window.matchMedia('(pointer: fine)').matches) {
  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let tx = mx, ty = my;
  const LERP = 0.13;

  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  (function tickCursor() {
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
    tx += (mx - tx) * LERP;
    ty += (my - ty) * LERP;
    trail.style.left = tx + 'px';
    trail.style.top  = ty + 'px';
    requestAnimationFrame(tickCursor);
  })();

  document.querySelectorAll('a, button').forEach(el => {
    el.addEventListener('mouseenter', () => { cursor.classList.add('hovering');    trail.classList.add('hovering'); });
    el.addEventListener('mouseleave', () => { cursor.classList.remove('hovering'); trail.classList.remove('hovering'); });
  });
}

// ── GPU THREAD CANVAS ──
const canvas = document.getElementById('gpu-canvas');
const ctx    = canvas.getContext('2d');
let W, H, particles = [], threads = [];

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

const NUM_PARTICLES = 120;
const NUM_THREADS   = 40;

for (let i = 0; i < NUM_THREADS; i++) {
  threads.push({
    x: Math.random() * 1.2 - 0.1,
    y: Math.random() * 1.2 - 0.1,
    vx: (Math.random() - 0.5) * 0.0005,
    vy: (Math.random() - 0.5) * 0.0005,
    speed: 0.3 + Math.random() * 0.7,
    trail: [],
  });
}
for (let i = 0; i < NUM_PARTICLES; i++) {
  particles.push({
    x:  Math.random() * 1.2 - 0.1,
    y:  Math.random() * 1.2 - 0.1,
    vx: (Math.random() - 0.5) * 0.001,
    vy: (Math.random() - 0.5) * 0.001,
    r:  0.5 + Math.random() * 1.5,
    a:  0.2 + Math.random() * 0.5,
  });
}

let t = 0;
function drawGPU() {
  ctx.clearRect(0, 0, W, H);
  t += 0.003;

  // connection lines
  ctx.lineWidth = 0.5;
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    for (let j = i + 1; j < particles.length; j++) {
      const q  = particles[j];
      const dx = (p.x - q.x) * W;
      const dy = (p.y - q.y) * H;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (d < 120) {
        ctx.globalAlpha = (1 - d / 120) * 0.3;
        ctx.strokeStyle = 'rgba(139,92,246,0.08)';
        ctx.beginPath();
        ctx.moveTo(p.x * W, p.y * H);
        ctx.lineTo(q.x * W, q.y * H);
        ctx.stroke();
      }
    }
  }
  ctx.globalAlpha = 1;

  // GPU thread streams
  threads.forEach(th => {
    th.x += th.vx;
    th.y += th.vy + th.speed * 0.0003;
    if (th.y > 1.1 || th.x < -0.1 || th.x > 1.1) {
      th.x = Math.random(); th.y = -0.05; th.trail = [];
    }
    th.trail.push({ x: th.x, y: th.y });
    if (th.trail.length > 20) th.trail.shift();
    if (th.trail.length > 1) {
      ctx.beginPath();
      ctx.moveTo(th.trail[0].x * W, th.trail[0].y * H);
      for (let i = 1; i < th.trail.length; i++) {
        ctx.lineTo(th.trail[i].x * W, th.trail[i].y * H);
      }
      const last = th.trail[th.trail.length - 1];
      const grad = ctx.createLinearGradient(
        th.trail[0].x * W, th.trail[0].y * H,
        last.x * W, last.y * H
      );
      grad.addColorStop(0, 'rgba(139,92,246,0)');
      grad.addColorStop(1, 'rgba(139,92,246,0.4)');
      ctx.strokeStyle = grad;
      ctx.lineWidth   = 0.8;
      ctx.stroke();
    }
  });

  // particles
  particles.forEach(p => {
    p.x += p.vx + Math.sin(t + p.y * 8) * 0.0001;
    p.y += p.vy + Math.cos(t + p.x * 8) * 0.0001;
    if (p.x < -0.05) p.x = 1.05;
    if (p.x > 1.05)  p.x = -0.05;
    if (p.y < -0.05) p.y = 1.05;
    if (p.y > 1.05)  p.y = -0.05;
    ctx.beginPath();
    ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(139,92,246,${p.a})`;
    ctx.fill();
  });

  requestAnimationFrame(drawGPU);
}
drawGPU();

// ── TYPEWRITER ──
const roles = [
  'GPU_Engineer()',
  'CUDA_Developer()',
  'HPC_Researcher()',
  'DevOps_Engineer()',
  'Systems_Programmer()',
];
let ri = 0, ci = 0, deleting = false;
const tw = document.getElementById('typewriter');

function type() {
  const cur = roles[ri];
  if (!deleting) {
    tw.textContent = cur.slice(0, ++ci);
    if (ci === cur.length) { deleting = true; setTimeout(type, 1800); return; }
    setTimeout(type, 60);
  } else {
    tw.textContent = cur.slice(0, --ci);
    if (ci === 0) { deleting = false; ri = (ri + 1) % roles.length; setTimeout(type, 300); return; }
    setTimeout(type, 30);
  }
}
type();

// ── SCROLL REVEAL ──
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      e.target.querySelectorAll('.skill-fill').forEach(bar => {
        bar.style.width = bar.dataset.w + '%';
      });
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll(
  '.reveal, .timeline-item, .project-card, .skill-group'
).forEach(el => observer.observe(el));

// stagger delays
document.querySelectorAll('.project-card').forEach((el, i) => { el.style.transitionDelay = (i * 0.10) + 's'; });
document.querySelectorAll('.skill-group').forEach( (el, i) => { el.style.transitionDelay = (i * 0.15) + 's'; });
document.querySelectorAll('.timeline-item').forEach((el,i) => { el.style.transitionDelay = (i * 0.20) + 's'; });
