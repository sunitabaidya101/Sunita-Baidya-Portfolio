(() => {
  "use strict";

  // 1. Copyright year
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // 2. Mobile navigation
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav-links");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // 3. Reveal elements as they enter the viewport
  const reveals = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -25px 0px" });

    reveals.forEach((element) => revealObserver.observe(element));
  } else {
    reveals.forEach((element) => element.classList.add("visible"));
  }

  // 4. Highlight the active navigation link
  const navLinks = [...document.querySelectorAll(".nav-links a")];

  document.querySelectorAll("main section[id]").forEach((section) => {
    if (!("IntersectionObserver" in window)) return;

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        navLinks.forEach((link) => {
          link.classList.toggle(
            "active",
            link.getAttribute("href") === `#${section.id}`
          );
        });
      });
    }, { rootMargin: "-35% 0px -55% 0px" });

    sectionObserver.observe(section);
  });

  // 5. Scroll-controlled background made from 300 JPG frames
  const canvas = document.getElementById("scroll-frame-canvas");
  const scene = document.getElementById("scroll-scene");
  if (!canvas || !scene) return;

  const context = canvas.getContext("2d", { alpha: false });
  const FRAME_COUNT = 300;
  const FRAME_PATH = "images/hammer/ezgif-frame-";
  const FRAME_EXTENSION = ".jpg";

  const frames = new Array(FRAME_COUNT);
  const loading = new Array(FRAME_COUNT).fill(false);
  let currentFrameIndex = 0;
  let scrollUpdatePending = false;
  let canvasWidth = 0;
  let canvasHeight = 0;

  function framePath(index) {
    return `${FRAME_PATH}${String(index + 1).padStart(3, "0")}${FRAME_EXTENSION}`;
  }

  function resizeCanvas() {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    canvas.width = Math.round(canvasWidth * pixelRatio);
    canvas.height = Math.round(canvasHeight * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    drawCurrentFrame();
  }

  function drawImageCover(image) {
    if (!image || !image.complete || !image.naturalWidth) return;

    const imageRatio = image.naturalWidth / image.naturalHeight;
    const canvasRatio = canvasWidth / canvasHeight;
    let width, height, x, y;

    if (imageRatio > canvasRatio) {
      height = canvasHeight;
      width = height * imageRatio;
      x = (canvasWidth - width) / 2;
      y = 0;
    } else {
      width = canvasWidth;
      height = width / imageRatio;
      x = 0;
      y = (canvasHeight - height) / 2;
    }

    context.clearRect(0, 0, canvasWidth, canvasHeight);
    context.drawImage(image, x, y, width, height);
  }

  function loadFrame(index) {
    if (index < 0 || index >= FRAME_COUNT || frames[index] || loading[index]) return;

    loading[index] = true;
    const image = new Image();
    image.decoding = "async";

    image.onload = () => {
      frames[index] = image;
      loading[index] = false;
      if (index === currentFrameIndex) drawCurrentFrame();
    };

    image.onerror = () => {
      loading[index] = false;
      console.warn(`Could not load frame: ${framePath(index)}`);
    };

    image.src = framePath(index);
  }

  function drawCurrentFrame() {
    if (!context || !canvasWidth || !canvasHeight) return;

    if (frames[currentFrameIndex]) {
      drawImageCover(frames[currentFrameIndex]);
      return;
    }

    loadFrame(currentFrameIndex);

    // Display the nearest already-loaded frame while the requested one loads.
    for (let distance = 1; distance < FRAME_COUNT; distance++) {
      const before = currentFrameIndex - distance;
      const after = currentFrameIndex + distance;

      if (before >= 0 && frames[before]) {
        drawImageCover(frames[before]);
        return;
      }
      if (after < FRAME_COUNT && frames[after]) {
        drawImageCover(frames[after]);
        return;
      }
    }
  }

  function updateFrameFromScroll() {
    const page = document.documentElement;
    const maxScroll = Math.max(1, page.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));

    currentFrameIndex = Math.round(progress * (FRAME_COUNT - 1));

    // Load the current frame and nearby frames first.
    loadFrame(currentFrameIndex);
    loadFrame(currentFrameIndex - 1);
    loadFrame(currentFrameIndex + 1);
    loadFrame(currentFrameIndex + 2);

    drawCurrentFrame();
    scrollUpdatePending = false;
  }

  function onScroll() {
    if (scrollUpdatePending) return;
    scrollUpdatePending = true;
    window.requestAnimationFrame(updateFrameFromScroll);
  }

  resizeCanvas();
  loadFrame(0);
  loadFrame(1);
  loadFrame(2);
  updateFrameFromScroll();

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", resizeCanvas);

  // Preload frames in small batches to reduce visible stutter.
  let nextBatchStart = 3;

  function preloadNextBatch() {
    const batchEnd = Math.min(nextBatchStart + 11, FRAME_COUNT);

    for (let index = nextBatchStart; index < batchEnd; index++) {
      loadFrame(index);
    }

    nextBatchStart = batchEnd;
    if (nextBatchStart < FRAME_COUNT) {
      window.setTimeout(preloadNextBatch, 120);
    }
  }

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(preloadNextBatch);
  } else {
    window.setTimeout(preloadNextBatch, 300);
  }
})();
