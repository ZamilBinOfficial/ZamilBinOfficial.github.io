/* ===================================================================
   ZAMIL BIN — EXECUTIVE BENTO PORTFOLIO
   script.js  v4.0.0 (Pure Vanilla JS, 0 dependencies)
   =================================================================== */

(() => {
  "use strict";

  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

  /* -----------------------------------------------------------------
     1. DHAKA LIVE CLOCK (UTC+6)
     ----------------------------------------------------------------- */
  function updateDhakaClock() {
    const el = document.getElementById("clockTime");
    if (!el) return;

    const now = new Date();
    // Dhaka is UTC+6
    const options = {
      timeZone: "Asia/Dhaka",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    };
    const timeStr = new Intl.DateTimeFormat("en-US", options).format(now);
    el.textContent = `${timeStr} BST`;
  }

  /* -----------------------------------------------------------------
     2. DYNAMIC ROLE FLIPPER
     ----------------------------------------------------------------- */
  function initRoleFlipper() {
    const el = document.getElementById("roleFlipper");
    if (!el) return;

    const roles = [
      "Video Editor @ Japy Loop",
      "Roblox Shorts Creator (507K+)",
      "Developer & Vibe Coder",
      "Full-Time Viber",
      "Minecraft Grinder"
    ];
    let idx = 0;

    setInterval(() => {
      el.classList.add("out");
      setTimeout(() => {
        idx = (idx + 1) % roles.length;
        el.textContent = roles[idx];
        el.classList.remove("out");
        el.classList.add("in");
        setTimeout(() => el.classList.remove("in"), 250);
      }, 250);
    }, 2800);
  }

  /* -----------------------------------------------------------------
     3. BENTO CARD SPOTLIGHT & CURSOR TORCH
     ----------------------------------------------------------------- */
  function initSpotlight() {
    if (isTouch) return;

    const spotlight = document.getElementById("cursorSpotlight");
    const cards = document.querySelectorAll(".bento-card, .social-box");

    window.addEventListener("pointermove", (e) => {
      if (spotlight) {
        spotlight.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      }

      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
        card.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
      });
    }, { passive: true });
  }

  /* -----------------------------------------------------------------
     4. COPY TO CLIPBOARD + TOAST NOTIFICATION
     ----------------------------------------------------------------- */
  function initCopyToast() {
    const toast = document.getElementById("toast");
    let timer = null;

    function showToast(msg) {
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add("is-shown");
      clearTimeout(timer);
      timer = setTimeout(() => {
        toast.classList.remove("is-shown");
      }, 2400);
    }

    document.querySelectorAll("[data-copy]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const text = btn.getAttribute("data-copy");
        if (!text) return;

        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
          } else {
            const ta = document.createElement("textarea");
            ta.value = text;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            ta.remove();
          }
          showToast(`Copied "${text}" — Let's chat! 🎮`);
        } catch {
          showToast(`Discord: ${text}`);
        }
      });
    });
  }

  /* -----------------------------------------------------------------
     5. FOOTER YEAR
     ----------------------------------------------------------------- */
  function initFooterYear() {
    const y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
  }

  /* -----------------------------------------------------------------
     BOOT
     ----------------------------------------------------------------- */
  function boot() {
    updateDhakaClock();
    setInterval(updateDhakaClock, 1000);
    initRoleFlipper();
    initSpotlight();
    initCopyToast();
    initFooterYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
