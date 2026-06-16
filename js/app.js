/* ═══════════════════════════════════════════════════
   RM 50-03 McLaren F1 — Scroll-Driven Canvas Site
   Frame order:  1 = assembled,  240 = exploded
   Scroll scrub: reversed → shows assembled→exploded
   as user scrolls DOWN the video scrubs BACKWARD
   (frame index goes 240 → 0 with scroll 0 → 1)
═══════════════════════════════════════════════════ */

const FRAME_COUNT   = 240;
const SCRUB_END     = 0.86;   // frames finish assembling by 86% scroll

/* ── DOM refs ─────────────────────────────────────── */
const canvas       = document.getElementById('canvas');
const ctx          = canvas.getContext('2d');
const canvasWrap   = document.getElementById('canvas-wrap');
const hero         = document.getElementById('hero');
const scrollCont   = document.getElementById('scroll-container');
const loader       = document.getElementById('loader');
const loaderBar    = document.getElementById('loader-bar');
const loaderPct    = document.getElementById('loader-percent');
const marquee      = document.getElementById('marquee');
const darkOverlay  = document.getElementById('dark-overlay');

/* ── State ────────────────────────────────────────── */
const frames       = new Array(FRAME_COUNT).fill(null);
let framesLoaded   = 0;
let currentFrame   = FRAME_COUNT - 1;   // start at exploded
let watchX         = 0.5;               // 0=left  0.5=center  1=right
let bgColor        = '#d2d0cd';         // sampled from frame edges (light gray)
let rafPending     = false;

/* ── Canvas resize ────────────────────────────────── */
function resize() {
  canvas.width  = Math.round(window.innerWidth  * devicePixelRatio);
  canvas.height = Math.round(window.innerHeight * devicePixelRatio);
  canvas.style.width  = window.innerWidth  + 'px';
  canvas.style.height = window.innerHeight + 'px';
  schedDraw();
}
window.addEventListener('resize', resize);
resize();

/* ── Draw ─────────────────────────────────────────── */
const IMAGE_SCALE = 0.94;

function draw() {
  rafPending = false;
  const img = frames[currentFrame];
  if (!img) return;

  const cw = canvas.width, ch = canvas.height;
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const scale = Math.max(cw / iw, ch / ih) * IMAGE_SCALE;
  const dw = iw * scale, dh = ih * scale;

  // X offset: watchX 0.5 = center, 0.3 = left-pinned
  const cx = cw * watchX;
  const dx = cx - dw / 2;
  const dy = (ch - dh) / 2;

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, cw, ch);
  ctx.drawImage(img, dx, dy, dw, dh);
}

function schedDraw() {
  if (!rafPending) { rafPending = true; requestAnimationFrame(draw); }
}

/* ── Sample bg colour from frame edges ────────────── */
function sampleBg(img) {
  try {
    const t = document.createElement('canvas');
    t.width = 6; t.height = 6;
    const c = t.getContext('2d');
    c.drawImage(img, 0, 0, 6, 6);
    const d = c.getImageData(0, 0, 1, 1).data;
    bgColor = `rgb(${d[0]},${d[1]},${d[2]})`;
  } catch(_) {}
}

/* ── Frame loader ─────────────────────────────────── */
function loadFrame(i, cb) {
  if (frames[i]) { cb?.(); return; }
  const img = new Image();
  img.onload = () => {
    frames[i] = img;
    framesLoaded++;
    const pct = Math.round(framesLoaded / FRAME_COUNT * 100);
    loaderBar.style.width = pct + '%';
    loaderPct.textContent = pct + '%';
    if (i % 24 === 0) sampleBg(img);
    if (framesLoaded === FRAME_COUNT) onReady();
    cb?.();
  };
  img.onerror = () => { framesLoaded++; cb?.(); };
  img.src = `frames/frame_${String(i + 1).padStart(4, '0')}.webp`;
}

function onReady() {
  loader.classList.add('hidden');
  initMotion();
}

function startLoad() {
  // Load last frame first (exploded = our visual start)
  loadFrame(FRAME_COUNT - 1, () => { draw(); });
  // Load all remaining frames with staggered delay
  for (let i = 0; i < FRAME_COUNT - 1; i++) {
    setTimeout(() => loadFrame(i), i * 1.8);
  }
}

/* ── Helpers ──────────────────────────────────────── */
function lerp(a, b, t) { return a + (b - a) * Math.max(0, Math.min(1, t)); }
function ease(t) { return t < 0.5 ? 2*t*t : -1 + (4 - 2*t)*t; }
function norm(v, lo, hi) { return Math.max(0, Math.min(1, (v - lo) / (hi - lo))); }

/* ── GSAP + Lenis ─────────────────────────────────── */
function initMotion() {
  gsap.registerPlugin(ScrollTrigger);

  /* Lenis smooth scroll */
  const lenis = new Lenis({
    duration: 1.15,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  window.__lenis = lenis; // expose for Puppeteer test access

  /* ── Nav entrance (fires immediately on load) ── */
  gsap.from('.site-header', { y: -36, opacity: 0, duration: 0.7, ease: 'power2.out' });

  /* ── Hero entrance (fires on load — hero is now the first screen) ── */
  const heroTl = gsap.timeline({
    scrollTrigger: { trigger: '#hero', start: 'top 75%', toggleActions: 'play none none none' }
  });
  heroTl
    .from('.hero-word',    { y: 90, opacity: 0, stagger: 0.12, duration: 1.3, ease: 'power4.out' }, 0)
    .from('.hero-eyebrow', { y: 20, opacity: 0, duration: 0.9,  ease: 'power3.out' }, 0.3)
    .from(['.hero-tagline', '.hero-cue'], { y: 24, opacity: 0, stagger: 0.1, duration: 0.9, ease: 'power3.out' }, 0.5)
    .from('.hero-watch-img', { x: 80, opacity: 0, duration: 1.5, ease: 'power3.out' }, 0.1);

  /* ── Master scroll driver ── */
  ScrollTrigger.create({
    trigger: scrollCont,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate(self) {
      const p = self.progress;
      updateHero(p);
      updateFrame(p);
      updateWatchX(p);
      updateMarquee(p);
      updateDarkOverlay(p);
    },
  });

  /* ── Sections ── */
  setupSections();
  setupCounters();
  setupMarqueeScroll();
}

/* ── Hero ↔ Canvas transition ─────────────────────── */
function updateHero(p) {
  // Hero fades from 0% → 10% scroll
  hero.style.opacity = String(Math.max(0, 1 - p / 0.10));

  // Canvas circle-wipe: starts 6%, full by 20%
  const wipe = norm(p, 0.06, 0.20);
  const r    = wipe * 82;
  canvasWrap.style.clipPath = `circle(${r}% at 50% 50%)`;
  canvasWrap.style.opacity  = wipe > 0 ? '1' : '0';
}

/* ── Frame scrub (REVERSED: exploded → assembled) ─── */
function updateFrame(p) {
  const sp    = Math.min(p / SCRUB_END, 1);
  const idx   = Math.max(0, Math.min(FRAME_COUNT - 1,
                  Math.floor((1 - sp) * (FRAME_COUNT - 1))));
  if (idx !== currentFrame) { currentFrame = idx; schedDraw(); }
}

/* ── Watch X position on canvas ──────────────────── */
function updateWatchX(p) {
  let x;
  if      (p < 0.18)                x = 0.5;
  else if (p < 0.26)                x = lerp(0.5, 0.30, ease(norm(p, 0.18, 0.26)));
  else if (p < 0.80)                x = 0.30;
  else if (p < 0.90)                x = lerp(0.30, 0.5,  ease(norm(p, 0.80, 0.90)));
  else                              x = 0.5;

  if (Math.abs(x - watchX) > 0.0005) { watchX = x; schedDraw(); }
}

/* ── Marquee ─────────────────────────────────────── */
function updateMarquee(p) {
  const fadeIn  = norm(p, 0.14, 0.20);
  const fadeOut = 1 - norm(p, 0.84, 0.90);
  marquee.style.opacity = String(Math.min(fadeIn, fadeOut));
}

/* ── Dark overlay (fades in for CTA) ─────────────── */
function updateDarkOverlay(p) {
  darkOverlay.style.opacity = String(norm(p, 0.84, 0.92) * 0.93);
}

/* ── Section animations ────────────────────────────── */
function setupSections() {
  const contH = parseFloat(getComputedStyle(scrollCont).height);

  document.querySelectorAll('.scroll-section[data-enter]').forEach(sec => {
    const enter   = parseFloat(sec.dataset.enter)   / 100;
    const leave   = parseFloat(sec.dataset.leave)   / 100;
    const type    = sec.dataset.animation;
    const persist = sec.dataset.persist === 'true';
    const mid     = (enter + leave) / 2;

    // Position vertically at midpoint of its scroll range
    sec.style.top       = mid * contH + 'px';
    sec.style.transform = 'translateY(-50%)';

    const kids = sec.querySelectorAll(
      '.section-label,.section-heading,.section-body,.spec-list,.badge-row,' +
      '.cta-heading,.cta-body,.cta-btn,.stats-row'
    );

    const tl = gsap.timeline({ paused: true });
    switch (type) {
      case 'fade-up':
        tl.from(kids, { y: 52, opacity: 0, stagger: 0.12, duration: 0.95, ease: 'power3.out' });
        break;
      case 'slide-left':
        tl.from(kids, { x: -68, opacity: 0, stagger: 0.12, duration: 0.95, ease: 'power3.out' });
        break;
      case 'slide-right':
        tl.from(kids, { x: 68,  opacity: 0, stagger: 0.12, duration: 0.95, ease: 'power3.out' });
        break;
      case 'rotate-in':
        tl.from(kids, { y: 42, rotation: 2.5, opacity: 0, stagger: 0.1, duration: 0.9, ease: 'power3.out' });
        break;
    }

    let played = false, hidden = false;

    ScrollTrigger.create({
      trigger: scrollCont,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate(self) {
        const p = self.progress;
        if (p >= enter && p <= leave) {
          gsap.set(sec, { opacity: 1 });
          sec.classList.add('is-active');
          if (!played) { tl.play(); played = true; hidden = false; }
        } else if (!persist) {
          sec.classList.remove('is-active');
          if (played && !hidden) {
            gsap.to(sec, { opacity: 0, duration: 0.38, ease: 'power2.in' });
            hidden = true; played = false;
          }
        }
      },
    });
  });
}

/* ── Counters ─────────────────────────────────────── */
function setupCounters() {
  document.querySelectorAll('.stat-num').forEach(el => {
    const target   = parseFloat(el.dataset.value);
    const decimals = parseInt(el.dataset.decimals || '0');
    gsap.fromTo(el,
      { textContent: 0 },
      {
        textContent: target,
        duration: 2.2,
        ease: 'power2.out',
        snap: { textContent: decimals === 0 ? 1 : 0.1 },
        scrollTrigger: {
          trigger: el.closest('.scroll-section'),
          start: 'top 75%',
          toggleActions: 'play none none reverse',
        },
      }
    );
  });
}

/* ── Marquee scroll movement ──────────────────────── */
function setupMarqueeScroll() {
  const track = marquee.querySelector('.marquee-track');
  gsap.to(track, {
    xPercent: -28,
    ease: 'none',
    scrollTrigger: {
      trigger: scrollCont,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
    },
  });
}

/* ── Boot ─────────────────────────────────────────── */
startLoad();
