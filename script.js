/* ===================================================================
   ZAMIL BIN — Personal Hub
   script.js  (vanilla JS, no frameworks)
   -------------------------------------------------------------------
   Modules in this file:
     1. Helpers & feature detection (reduced motion, touch, etc.)
     2. Reusable 3D tilt engine  (any [data-tilt] element)
     3. Mouse parallax for floaters + ambient blobs
     4. Scroll parallax (lightweight, rAF-driven)
     5. Canvas starfield (slow drifting particles)
     6. Scroll-reveal (IntersectionObserver) + staggering
     7. Navbar: scroll state + mobile menu
     8. Copy-to-clipboard (Discord username) + toast
     9. Footer year
   All animation is GPU-friendly (transform / opacity) and respects
   prefers-reduced-motion.  Heavy mouse effects auto-disable on touch.
   =================================================================== */

(() => {
  "use strict";

  /* =================================================================
     1. HELPERS & FEATURE DETECTION
     ================================================================= */
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Treat coarse pointers (phones/tablets) as "no fancy mouse effects"
  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  // Disable the most expensive 3D effects on small viewports for performance
  const isSmallScreen = window.matchMedia("(max-width: 820px)").matches;

  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const lerp  = (a, b, t) => a + (b - a) * t;

  // Pointer position normalised to -0.5..0.5 (centre of screen = 0,0)
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };


  /* =================================================================
     2. REUSABLE 3D TILT ENGINE
     Apply by adding  data-tilt  to any element.
     Optional:  data-tilt-max="12"  (max degrees, default 10)
     -----------------------------------------------------------------
     The element tilts in 3D toward the cursor and a soft "glare"
     follows the pointer. Children with translateZ() pop forward.
     ================================================================= */
  function initTilt() {
    if (prefersReducedMotion || isTouch) return; // skip on touch / reduced motion

    const tiltEls = document.querySelectorAll("[data-tilt]");

    tiltEls.forEach((el) => {
      const maxTilt = parseFloat(el.dataset.tiltMax) || 10;
      // give the element a 3D-aware parent perspective
      el.style.transformStyle = "preserve-3d";

      let raf = null;
      let targetRX = 0, targetRY = 0, curRX = 0, curRY = 0;
      let targetScale = 1, curScale = 1;
      let hovering = false;

      function render() {
        // ease current values toward targets for buttery motion
        curRX = lerp(curRX, targetRX, 0.12);
        curRY = lerp(curRY, targetRY, 0.12);
        curScale = lerp(curScale, targetScale, 0.12);

        el.style.transform =
          `perspective(900px) rotateX(${curRX.toFixed(2)}deg) rotateY(${curRY.toFixed(2)}deg) ` +
          `scale(${curScale.toFixed(3)})`;

        // keep animating while there's meaningful movement
        const settled =
          Math.abs(curRX - targetRX) < 0.01 &&
          Math.abs(curRY - targetRY) < 0.01 &&
          Math.abs(curScale - targetScale) < 0.001;

        if (settled && !hovering) {
          // hand transform back to the stylesheet (none) and re-enable
          // CSS transitions now that the JS-driven interaction is over
          el.style.transform = "";
          el.style.transition = "";
          el.style.willChange = "auto";
          raf = null;
          return;
        }
        raf = requestAnimationFrame(render);
      }

      function start() { if (!raf) raf = requestAnimationFrame(render); }

      el.addEventListener("mouseenter", () => {
        hovering = true;
        targetScale = 1.02;
        // disable the inherited .reveal transform-transition so the
        // per-frame tilt isn't double-animated (JS lerp handles smoothing)
        el.style.transition = "none";
        el.style.willChange = "transform";
        start();
      });

      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        // px = -0.5..0.5 across the element
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        // invert Y so moving up tilts the top toward you
        targetRY = px * maxTilt * 2;
        targetRX = -py * maxTilt * 2;
        start();

        // move the glare hotspot (used by ::before is fixed; we set CSS vars)
        el.style.setProperty("--mx", `${(px + 0.5) * 100}%`);
        el.style.setProperty("--my", `${(py + 0.5) * 100}%`);
      });

      el.addEventListener("mouseleave", () => {
        hovering = false;
        targetRX = 0; targetRY = 0; targetScale = 1;
        start(); // render() clears transform/transition/will-change once settled
      });
    });
  }


  /* =================================================================
     3. MOUSE PARALLAX — floaters & ambient blobs follow the cursor
     Each element declares its strength with  data-depth="0.06".
     ================================================================= */
  let parallaxEls = [];
  function collectParallax() {
    parallaxEls = Array.from(document.querySelectorAll("[data-depth]")).map((el) => ({
      el,
      depth: parseFloat(el.dataset.depth) || 0.04,
      // remember any base animation transform isn't disturbed: we use a wrapper translate
      x: 0, y: 0,
    }));
  }

  function onPointerMove(e) {
    // normalise around screen centre
    pointer.tx = (e.clientX / window.innerWidth - 0.5);
    pointer.ty = (e.clientY / window.innerHeight - 0.5);
  }


  /* =================================================================
     4. SCROLL PARALLAX + 5. unified rAF loop
     A single requestAnimationFrame loop drives pointer easing,
     parallax, and blob drift — cheaper than many separate loops.
     ================================================================= */
  let scrollY = window.scrollY;
  let ticking = true;

  function frame() {
    // ease the pointer for smooth, weighty motion
    pointer.x = lerp(pointer.x, pointer.tx, 0.08);
    pointer.y = lerp(pointer.y, pointer.ty, 0.08);

    if (!isTouch && !prefersReducedMotion) {
      for (const p of parallaxEls) {
        // mouse offset (px) scaled by depth
        const mxOffset = pointer.x * p.depth * 600;
        const myOffset = pointer.y * p.depth * 600;
        p.el.style.transform = `translate3d(${mxOffset.toFixed(1)}px, ${myOffset.toFixed(1)}px, 0)`;
      }
    }

    requestAnimationFrame(frame);
  }


  /* =================================================================
     5. CANVAS STARFIELD — slow drifting particles
     Lightweight: particle count scales with screen size; pauses
     when the tab is hidden; respects reduced motion (static dots).
     ================================================================= */
  function initStarfield() {
    const canvas = document.getElementById("starfield");
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });

    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let stars = [];
    let animId = null;

    const COLORS = ["#8b5cf6", "#06b6d4", "#ec4899", "#ffffff"];

    function resize() {
      w = canvas.clientWidth = window.innerWidth;
      h = canvas.clientHeight = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // density scales with area, capped for performance
      const count = clamp(Math.floor((w * h) / 14000), 40, 150);
      stars = Array.from({ length: count }, () => makeStar());
    }

    function makeStar() {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random() * 0.8 + 0.2,          // depth → size & speed
        r: Math.random() * 1.6 + 0.4,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12 - 0.04, // slight upward drift
        tw: Math.random() * Math.PI * 2,         // twinkle phase
        color: COLORS[(Math.random() * COLORS.length) | 0],
      };
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        // drift (parallax with eased pointer for subtle depth)
        s.x += s.vx + pointer.x * s.z * 0.4;
        s.y += s.vy + pointer.y * s.z * 0.4;
        s.tw += 0.02;

        // wrap around edges
        if (s.x < -5) s.x = w + 5; else if (s.x > w + 5) s.x = -5;
        if (s.y < -5) s.y = h + 5; else if (s.y > h + 5) s.y = -5;

        const twinkle = 0.5 + Math.sin(s.tw) * 0.5;
        ctx.globalAlpha = (0.25 + twinkle * 0.6) * s.z;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * s.z + 0.3, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    }

    function drawStatic() {
      // reduced-motion: render once, no animation
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        ctx.globalAlpha = 0.5 * s.z;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * s.z + 0.3, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function startAnim() {
      if (prefersReducedMotion) { drawStatic(); return; }
      if (!animId) animId = requestAnimationFrame(draw);
    }
    function stopAnim() { if (animId) { cancelAnimationFrame(animId); animId = null; } }

    resize();
    startAnim();

    // debounce resize
    let rt;
    window.addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(() => { dpr = Math.min(window.devicePixelRatio || 1, 2); resize(); if (prefersReducedMotion) drawStatic(); }, 200);
    });

    // pause when tab not visible (saves battery/CPU)
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopAnim(); else startAnim();
    });
  }


  /* =================================================================
     6. SCROLL-REVEAL with stagger
     Adds .is-visible when an element scrolls into view.
     Siblings inside the same grid get a small incremental delay.
     ================================================================= */
  function initReveal() {
    const revealEls = document.querySelectorAll(".reveal");

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      revealEls.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        // stagger cards within a grid based on their index among siblings
        const parent = el.parentElement;
        let delay = 0;
        if (parent && (parent.classList.contains("cards-grid") || parent.classList.contains("links-grid"))) {
          delay = Array.prototype.indexOf.call(parent.children, el) * 90;
        }
        el.style.transitionDelay = `${delay}ms`;
        el.classList.add("is-visible");
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    revealEls.forEach((el) => io.observe(el));
  }


  /* =================================================================
     7. NAVBAR — scroll state + mobile menu
     ================================================================= */
  function initNav() {
    const nav = document.getElementById("nav");
    const toggle = document.getElementById("navToggle");
    const links = document.querySelector(".nav__links");

    // solidify nav once the user scrolls a little
    const onScroll = () => {
      scrollY = window.scrollY;
      nav.classList.toggle("is-scrolled", scrollY > 24);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // mobile menu open/close
    if (toggle && links) {
      const closeMenu = () => {
        toggle.classList.remove("is-open");
        links.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      };
      toggle.addEventListener("click", () => {
        const open = toggle.classList.toggle("is-open");
        links.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", String(open));
      });
      // close after clicking a link
      links.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));
      // close on Escape
      document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
    }
  }


  /* =================================================================
     8. COPY-TO-CLIPBOARD (Discord) + TOAST
     Any element with data-copy="..." copies that text on click.
     ================================================================= */
  function initCopy() {
    const toast = document.getElementById("toast");
    let toastTimer = null;

    function showToast(msg) {
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add("is-shown");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove("is-shown"), 2200);
    }

    document.querySelectorAll("[data-copy]").forEach((el) => {
      el.addEventListener("click", async (e) => {
        e.preventDefault();
        const text = el.dataset.copy;
        try {
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
          } else {
            // fallback for non-secure contexts
            const ta = document.createElement("textarea");
            ta.value = text;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
          }
          showToast(`Copied  ${text}  — let's game! 🎮`);
        } catch {
          showToast(`Discord: ${text}`);
        }
      });
    });
  }


  /* =================================================================
     9. FOOTER YEAR
     ================================================================= */
  function initYear() {
    const y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
  }


  /* =================================================================
     BOOT — run everything once the DOM is ready
     ================================================================= */
  function boot() {
    initYear();
    initNav();
    initReveal();
    initCopy();
    initStarfield();

    // mouse-driven 3D only when it makes sense
    if (!isTouch && !prefersReducedMotion) {
      initTilt();
      collectParallax();
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      requestAnimationFrame(frame); // start the unified parallax loop
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
