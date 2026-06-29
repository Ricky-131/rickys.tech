// ───────────────────── main.js ─────────────────────
// Modular, self-contained. No external dependencies.

// ── CURSOR (desktop/mouse only) ──
const Cursor = {
  dot: document.getElementById('cursor'),
  trail: document.getElementById('cursor-trail'),
  active: false,
  mx: 0, my: 0,
  tx: 0, ty: 0,
  LERP: 0.12,

  init() {
    if (!this.dot || !this.trail) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    this.active = true;

    document.addEventListener('mousemove', e => {
      this.mx = e.clientX; this.my = e.clientY;
    });

    this._attachHover();
    this.tick();
  },

  _attachHover() {
    const selectors = 'a, button, .btn-primary, .btn-outline, .contact-link, .project-card, .timeline-card, .nav-links a, #dl-cv';
    document.querySelectorAll(selectors).forEach(el => {
      el.addEventListener('mouseenter', () => this.hover(true));
      el.addEventListener('mouseleave', () => this.hover(false));
    });
  },

  hover(on) {
    if (!this.active) return;
    const cls = on ? 'add' : 'remove';
    this.dot.classList[cls]('hovering');
    this.trail.classList[cls]('hovering');
  },

  tick() {
    if (!this.active) return;
    this.dot.style.left = this.mx + 'px';
    this.dot.style.top  = this.my + 'px';
    this.tx += (this.mx - this.tx) * this.LERP;
    this.ty += (this.my - this.ty) * this.LERP;
    this.trail.style.left = this.tx + 'px';
    this.trail.style.top  = this.ty + 'px';
    requestAnimationFrame(() => this.tick());
  }
};


// ── GPU THREAD CANVAS (with page-visibility pause) ──
const Canvas = {
  canvas: document.getElementById('gpu-canvas'),
  ctx: null,
  W: 0, H: 0,
  particles: [], threads: [],
  t: 0,
  rafId: null,
  active: true,
  NUM_PARTICLES: 80,
  NUM_THREADS: 30,

  init() {
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.createElements();

    // Pause when tab hidden / resume when visible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.active = false;
        if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; }
      } else {
        this.active = true;
        if (!this.rafId) this.draw();
      }
    });

    this.draw();
  },

  resize() {
    this.W = this.canvas.width = window.innerWidth;
    this.H = this.canvas.height = window.innerHeight;
  },

  createElements() {
    for (let i = 0; i < this.NUM_THREADS; i++) {
      this.threads.push({
        x: Math.random() * 1.2 - 0.1,
        y: Math.random() * 1.2 - 0.1,
        vx: (Math.random() - 0.5) * 0.0005,
        vy: (Math.random() - 0.5) * 0.0005,
        speed: 0.3 + Math.random() * 0.7,
        trail: [],
      });
    }
    for (let i = 0; i < this.NUM_PARTICLES; i++) {
      this.particles.push({
        x:  Math.random() * 1.2 - 0.1,
        y:  Math.random() * 1.2 - 0.1,
        vx: (Math.random() - 0.5) * 0.001,
        vy: (Math.random() - 0.5) * 0.001,
        r:  0.8 + Math.random() * 1.5,
        a:  0.35 + Math.random() * 0.5,
      });
    }
  },

  draw() {
    if (!this.active) { this.rafId = null; return; }
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.W, this.H);
    this.t += 0.003;

    // connection lines — sparse neighborhood check for O(n) performance
    ctx.lineWidth = 0.5;
    const pCount = this.particles.length;
    const checkLimit = 12; // max 12 nearest neighbors per particle
    for (let i = 0; i < pCount; i++) {
      const p = this.particles[i];
      // only check nearby particles to reduce from O(n²) to O(n·k)
      const end = Math.min(i + checkLimit, pCount);
      for (let j = i + 1; j < end; j++) {
        const q = this.particles[j];
        const dx = (p.x - q.x) * this.W;
        const dy = (p.y - q.y) * this.H;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          ctx.globalAlpha = (1 - dist / 150) * 0.35;
          ctx.strokeStyle = 'rgba(124,58,237,0.15)';
          ctx.beginPath();
          ctx.moveTo(p.x * this.W, p.y * this.H);
          ctx.lineTo(q.x * this.W, q.y * this.H);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;

    // thread streams
    this.threads.forEach(th => {
      th.x += th.vx;
      th.y += th.vy + th.speed * 0.0003;
      if (th.y > 1.1 || th.x < -0.1 || th.x > 1.1) {
        th.x = Math.random(); th.y = -0.05; th.trail = [];
      }
      th.trail.push({ x: th.x, y: th.y });
      if (th.trail.length > 18) th.trail.shift();
      if (th.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(th.trail[0].x * this.W, th.trail[0].y * this.H);
        for (let i = 1; i < th.trail.length; i++) {
          ctx.lineTo(th.trail[i].x * this.W, th.trail[i].y * this.H);
        }
        const last = th.trail[th.trail.length - 1];
        const grad = ctx.createLinearGradient(
          th.trail[0].x * this.W, th.trail[0].y * this.H,
          last.x * this.W, last.y * this.H
        );
        grad.addColorStop(0, 'rgba(124,58,237,0)');
        grad.addColorStop(1, 'rgba(124,58,237,0.55)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
    });

    // particles
    this.particles.forEach(p => {
      p.x += p.vx + Math.sin(this.t + p.y * 8) * 0.00008;
      p.y += p.vy + Math.sin(this.t + p.x * 8) * 0.00008;
      if (p.x < -0.05) p.x = 1.05;
      if (p.x > 1.05)  p.x = -0.05;
      if (p.y < -0.05) p.y = 1.05;
      if (p.y > 1.05)  p.y = -0.05;
      ctx.beginPath();
      ctx.arc(p.x * this.W, p.y * this.H, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(124,58,237,${p.a})`;
      ctx.fill();
    });

    this.rafId = requestAnimationFrame(() => this.draw());
  }
};


// ── TYPEWRITER ──
const Typewriter = {
  roles: [
    'GPU_Engineer()',
    'CUDA_Developer()',
    'HPC_Researcher()',
    'DevOps_Engineer()',
    'Systems_Programmer()',
  ],
  ri: 0, ci: 0, deleting: false,
  el: document.getElementById('typewriter'),
  timer: null,
  paused: false,

  init() {
    if (!this.el) return;
    this.type();
    // pause on tab hidden
    document.addEventListener('visibilitychange', () => {
      this.paused = document.hidden;
    });
  },

  type() {
    if (this.paused) { requestAnimationFrame(() => this.type()); return; }
    const cur = this.roles[this.ri];
    if (!this.deleting) {
      this.el.textContent = cur.slice(0, ++this.ci);
      if (this.ci === cur.length) { this.deleting = true; this.timer = setTimeout(() => this.type(), 2000); return; }
      this.timer = setTimeout(() => this.type(), 55);
    } else {
      this.el.textContent = cur.slice(0, --this.ci);
      if (this.ci === 0) { this.deleting = false; this.ri = (this.ri + 1) % this.roles.length; this.timer = setTimeout(() => this.type(), 400); return; }
      this.timer = setTimeout(() => this.type(), 28);
    }
  }
};


// ── SCROLL REVEAL ──
const ScrollReveal = {
  observer: null,

  init() {
    this.observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          // Animate skill bars
          e.target.querySelectorAll('.skill-fill').forEach(bar => {
            bar.style.width = bar.dataset.w + '%';
          });
          // Stop observing once revealed
          this.observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('.reveal, .timeline-item, .project-card, .skill-group').forEach(el => {
      this.observer.observe(el);
    });

    // Stagger delays
    document.querySelectorAll('.project-card').forEach((el, i) => { el.style.transitionDelay = (i * 0.12) + 's'; });
    document.querySelectorAll('.skill-group').forEach( (el, i) => { el.style.transitionDelay = (i * 0.18) + 's'; });
    document.querySelectorAll('.timeline-item').forEach((el, i) => { el.style.transitionDelay = (i * 0.22) + 's'; });
  }
};


// ── SMOOTH SCROLL (offset for fixed nav) ──
const SmoothScroll = {
  init() {
    const navHeight = document.querySelector('nav')?.offsetHeight || 70;
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', e => {
        const href = link.getAttribute('href');
        if (href.length <= 1) return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  }
};


// ── ACTIVE NAV HIGHLIGHTING ──
const NavHighlight = {
  sections: [],
  observer: null,

  init() {
    this.sections = Array.from(document.querySelectorAll('section[id]'));
    if (this.sections.length === 0) return;

    this.observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.setActive(entry.target.id);
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

    this.sections.forEach(s => this.observer.observe(s));
  },

  setActive(id) {
    document.querySelectorAll('.nav-links a').forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
    });
  }
};


// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  Cursor.init();
  Canvas.init();
  Typewriter.init();
  ScrollReveal.init();
  SmoothScroll.init();
  NavHighlight.init();
});
