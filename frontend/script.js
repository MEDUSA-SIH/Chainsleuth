/* ============================================================
   VASPTrace — interactive landing page behaviours
   1. reduced-motion detection
   2. navbar (scroll state, mobile menu, active section)
   3. scroll-reveal via IntersectionObserver
   4. hero canvas transaction-trace graph
   ============================================================ */

(function () {
  "use strict";

  var motionOK = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!motionOK) document.documentElement.classList.add("no-motion");

  /* ---------------- navbar ---------------- */

  var nav = document.getElementById("siteNav");
  var toggle = document.getElementById("navToggle");
  var navLinks = document.getElementById("navLinks");

  function onScroll() {
    if (window.scrollY > 8) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  toggle.addEventListener("click", function () {
    var open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!open));
    navLinks.classList.toggle("is-open", !open);
  });

  navLinks.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      toggle.setAttribute("aria-expanded", "false");
      navLinks.classList.remove("is-open");
    });
  });

  /* active section highlight */
  var linkBySection = {};
  navLinks.querySelectorAll("a[href^='#']").forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length > 1) {
        var el = document.querySelector(id);
        if (el) {
          e.preventDefault();
          el.scrollIntoView({ behavior: motionOK ? "smooth" : "auto" });
        }
      }
    });
    var id = a.getAttribute("href").slice(1);
    if (id) {
      var s = document.getElementById(id);
      if (s) linkBySection[id] = a;
    }
  });

  if ("IntersectionObserver" in window && Object.keys(linkBySection).length) {
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          Object.values(linkBySection).forEach(function (a) { a.classList.remove("active"); });
          var a = linkBySection[en.target.id];
          if (a) a.classList.add("active");
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    Object.keys(linkBySection).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) spy.observe(el);
    });
  }

  /* ---------------- scroll reveal ---------------- */

  var revealEls = document.querySelectorAll(".reveal");
  if (motionOK && "IntersectionObserver" in window) {
    var ro = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            ro.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach(function (el) { ro.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ============================================================
     HERO GRAPH
     ============================================================ */

  var canvas = document.getElementById("graphCanvas");
  if (!canvas) return;

  var wrap = document.getElementById("graphBody");
  var card = document.getElementById("attribCard");
  var ctx = canvas.getContext("2d");

  var W = 0, H = 0, dpr = 1;
  var bg = document.createElement("canvas");
  var bgCtx = bg.getContext("2d");

  /* layout in CSS-px fractions */
  var nodes = {
    suspect: { x: 0.10, y: 0.60, r: 5.5, color: "#fb7185", label: "0x7f3a…" },
    mixer:   { x: 0.44, y: 0.56, r: 6.5, color: "#fbbf24", label: "mixer" },
    target:  { x: 0.76, y: 0.28, r: 6.5, color: "#2563eb", label: "VASP-A" },
    vaspB:   { x: 0.64, y: 0.72, r: 5.0, color: "#3b82f6", label: "VASP-B" },
    vaspC:   { x: 0.86, y: 0.64, r: 4.2, color: "#1d4ed8", label: "VASP-C" },
    w1: { x: 0.26, y: 0.30, r: 2.6, color: "#5b6270" },
    w2: { x: 0.26, y: 0.82, r: 2.6, color: "#5b6270" },
    w3: { x: 0.60, y: 0.36, r: 2.6, color: "#5b6270" },
    w4: { x: 0.60, y: 0.84, r: 2.6, color: "#5b6270" }
  };

  /* ambient edges (faint) between non-trace nodes */
  var ambient = [
    ["w1", "w3"], ["w2", "w4"], ["w3", "vaspB"], ["w4", "vaspC"],
    ["vaspB", "vaspC"], ["suspect", "w1"], ["mixer", "w3"], ["mixer", "w4"]
  ];
  /* primary trace: suspect -> mixer -> target */
  var trace = ["suspect", "mixer", "target"];

  function nd(id) { return nodes[id]; }

  /* position in css px */
  var P = {};
  function layout() {
    nodes.suspect = { x: W * 0.10, y: H * 0.60, r: 5.5, color: "#fb7185", label: "0x7f3a…" };
    nodes.mixer   = { x: W * 0.44, y: H * 0.56, r: 6.5, color: "#fbbf24", label: "mixer" };
    nodes.target  = { x: W * 0.76, y: H * 0.28, r: 6.5, color: "#2563eb", label: "VASP-A" };
    nodes.vaspB   = { x: W * 0.64, y: H * 0.72, r: 5.0, color: "#3b82f6", label: "VASP-B" };
    nodes.vaspC   = { x: W * 0.86, y: H * 0.64, r: 4.2, color: "#1d4ed8", label: "VASP-C" };
    nodes.w1 = { x: W * 0.26, y: H * 0.30, r: 2.6, color: "#5b6270" };
    nodes.w2 = { x: W * 0.26, y: H * 0.82, r: 2.6, color: "#5b6270" };
    nodes.w3 = { x: W * 0.60, y: H * 0.36, r: 2.6, color: "#5b6270" };
    nodes.w4 = { x: W * 0.60, y: H * 0.84, r: 2.6, color: "#5b6270" };
  }

  function dist(a, b) {
    return Math.hypot(nd(a).x - nd(b).x, nd(a).y - nd(b).y);
  }

  /* pre-render static background: grid + edges + nodes */
  function renderBg() {
    var bw = Math.max(1, Math.floor(W));
    var bh = Math.max(1, Math.floor(H));
    bg.width = bw * dpr;
    bg.height = bh * dpr;
    bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bgCtx.clearRect(0, 0, W, H);

    layout();

    /* ambient edges */
    bgCtx.strokeStyle = "rgba(255,255,255,0.06)";
    bgCtx.lineWidth = 1;
    ambient.forEach(function (pair) {
      var a = nd(pair[0]), b = nd(pair[1]);
      bgCtx.beginPath();
      bgCtx.moveTo(a.x, a.y);
      bgCtx.lineTo(b.x, b.y);
      bgCtx.stroke();
    });

    /* trace route (dim base) */
    var grad = bgCtx.createLinearGradient(nd("suspect").x, nd("suspect").y, nd("target").x, nd("target").y);
    grad.addColorStop(0, "rgba(37,99,235,0.10)");
    grad.addColorStop(1, "rgba(59,130,246,0.22)");
    bgCtx.strokeStyle = grad;
    bgCtx.lineWidth = 1.2;
    bgCtx.beginPath();
    bgCtx.moveTo(nd("suspect").x, nd("suspect").y);
    bgCtx.lineTo(nd("mixer").x, nd("mixer").y);
    bgCtx.lineTo(nd("target").x, nd("target").y);
    bgCtx.stroke();

    /* node bases */
    Object.keys(nodes).forEach(function (id) {
      var n = nd(id);
      if (n.r <= 3) {
        bgCtx.fillStyle = n.color;
        bgCtx.globalAlpha = 0.6;
        bgCtx.beginPath();
        bgCtx.arc(n.x, n.y, n.r, 0, 6.283);
        bgCtx.fill();
        bgCtx.globalAlpha = 1;
      } else {
        if (id === "mixer" || id === "target") {
          bgCtx.strokeStyle = n.color;
          bgCtx.globalAlpha = 0.18;
          bgCtx.lineWidth = 1;
          bgCtx.beginPath();
          bgCtx.arc(n.x, n.y, n.r * 2.4, 0, 6.283);
          bgCtx.stroke();
          bgCtx.globalAlpha = 1;
        }
        bgCtx.fillStyle = n.color;
        bgCtx.shadowColor = n.color;
        bgCtx.shadowBlur = 12;
        bgCtx.beginPath();
        bgCtx.arc(n.x, n.y, n.r, 0, 6.283);
        bgCtx.fill();
        bgCtx.shadowBlur = 0;

        if (n.label) {
          bgCtx.font = "11px 'JetBrains Mono', monospace";
          bgCtx.textAlign = "center";
          bgCtx.fillStyle = "rgba(154,161,176,0.85)";
          bgCtx.fillText(n.label, n.x, n.y - n.r - 7);
        }
        /* suspect marker: mono tag below */
        if (id === "suspect") {
          bgCtx.font = "10px 'JetBrains Mono', monospace";
          bgCtx.fillStyle = "rgba(251,113,133,0.7)";
          bgCtx.fillText("SUSPECT", n.x, n.y + n.r + 16);
        }
      }
    });
  }

  /* sample a point at path-distance s in [0, totalLen] */
  function pointAt(s) {
    var segs = trace.length - 1;
    var lens = [];
    var total = 0;
    for (var i = 0; i < segs; i++) {
      var d = dist(trace[i], trace[i + 1]);
      lens.push(d);
      total += d;
    }
    s = Math.max(0, Math.min(total, s));
    var acc = 0;
    for (var j = 0; j < segs; j++) {
      if (acc + lens[j] >= s || j === segs - 1) {
        var t = lens[j] === 0 ? 0 : (s - acc) / lens[j];
        var a = nd(trace[j]), b = nd(trace[j + 1]);
        return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, idx: j };
      }
      acc += lens[j];
    }
    return { x: nd(trace[segs]).x, y: nd(trace[segs]).y };
  }

  function drawTrace(t) {
    var segs = trace.length - 1;
    var lens = [];
    var total = 0;
    for (var i = 0; i < segs; i++) { lens.push(dist(trace[i], trace[i + 1])); total += lens[i]; }

    /* travelled portion */
    var head = pointAt(((t * 1.25) % 1.25) * total);
    var headLen = Math.min(((t * 1.25) % 1.25) * total, total);

    ctx.lineCap = "round";
    var gl = ctx.createLinearGradient(nd("suspect").x, nd("suspect").y, nd("target").x, nd("target").y);
    gl.addColorStop(0, "rgba(37,99,235,0.55)");
    gl.addColorStop(1, "rgba(59,130,246,0.9)");
    ctx.strokeStyle = gl;
    ctx.lineWidth = 2;
    ctx.shadowColor = "#2563eb";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(nd("suspect").x, nd("suspect").y);
    var acc = 0;
    for (var k = 1; k <= segs; k++) {
      acc += lens[k - 1];
      if (acc <= headLen) ctx.lineTo(nd(trace[k]).x, nd(trace[k]).y);
      else break;
    }
    ctx.lineTo(head.x, head.y);
    ctx.stroke();
    ctx.shadowBlur = 0;

    /* trailing glow */
    for (var trail = 1; trail <= 7; trail++) {
      var s = Math.max(0, headLen - trail * 22);
      var p = pointAt(s);
      ctx.globalAlpha = 0.35 * (1 - trail / 8);
      ctx.fillStyle = "#60a5fa";
      ctx.shadowColor = "#2563eb";
      ctx.shadowBlur = 14 - trail;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.4 - trail * 0.25, 0, 6.283);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  function jog(t) {
    return Math.sin(t * 2) * 1.2;
  }

  function drawFrame(t) {
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(bg, 0, 0, W, H);

    /* amber pulses radiating from mixer hard-stop */
    Object.keys(nodes).forEach(function (id) {
      var n = nd(id);
      var pulse, col;
      if (id === "suspect") { pulse = 0.5 + 0.5 * Math.sin(t * 2.2 + 1); col = "rgba(251,113,133,"; n.x = nodes.suspect.x + jog(t); n.y = nodes.suspect.y; }
      else if (id === "mixer") { pulse = 0.5 + 0.5 * Math.sin(t * 1.8); col = "rgba(251,191,36,"; n.x = nodes.mixer.x; n.y = nodes.mixer.y + jog(t * 0.7); }
      else if (id === "target") { pulse = 0.5 + 0.5 * Math.sin(t * 1.6 + 2); col = "rgba(37,99,235,"; n.x = nodes.target.x + Math.sin(t) * 0.6; n.y = nodes.target.y + Math.cos(t) * 0.6; }
      else return;

      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r + 6 + pulse * 7, 0, 6.283);
      ctx.strokeStyle = col + (0.14 * (1 - pulse) + 0.05).toFixed(3) + ")";
      ctx.lineWidth = 1.4;
      ctx.stroke();
    });

    drawTrace(t);

    /* attribution beam: target -> card */
    if (card && getComputedStyle(card).display !== "none") {
      var cr = card.getBoundingClientRect();
      var cb = wrap.getBoundingClientRect();
      var ax = cr.left - cb.left;
      var ay = cr.top - cb.top + cr.height * 0.28;
      ctx.save();
      ctx.strokeStyle = "rgba(37,99,235,0.35)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 7]);
      ctx.lineDashOffset = -t * 18;
      ctx.beginPath();
      ctx.moveTo(nd("target").x, nd("target").y);
      ctx.lineTo(ax, ay);
      ctx.stroke();
      ctx.restore();
    }
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    W = Math.max(1, Math.round(rect.width));
    H = Math.max(1, Math.round(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderBg();
  }

  var rafId = null;
  var running = false;

  function loop(ts) {
    var t = (ts || 0) / 1000;
    drawFrame(t);
    rafId = requestAnimationFrame(loop);
  }

  function start() { if (!running) { running = true; rafId = requestAnimationFrame(loop); } }
  function stop() {
    running = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }

  /* pause rendering off-screen (skip for reduced motion) */
  if (motionOK && "IntersectionObserver" in window) {
    var vis = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) start();
        else stop();
      });
    });
    vis.observe(canvas);
  }

  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 160);
  });

  resize();

  if (!motionOK) {
    /* static frame, no animation loop */
    drawFrame(2.6);
  } else {
    start();
  }
})();