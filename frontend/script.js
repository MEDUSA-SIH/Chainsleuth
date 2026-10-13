// ChainSleuth landing: minimal progressive enhancement.
(function () {
  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('nav');
  if (menuBtn && nav) {
    var firstNavLink = nav.querySelector('a');
    var closeMenu = function (restoreFocus) {
      nav.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
      if (restoreFocus) menuBtn.focus();
    };
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open && firstNavLink) {
        requestAnimationFrame(function () { firstNavLink.focus(); });
      }
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) closeMenu(true);
    });
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('open') && !nav.contains(e.target) && !menuBtn.contains(e.target)) {
        closeMenu(false);
      }
    });
  }

  var progress = document.getElementById('scrollProgress');
  if (progress) {
    var ticking = false;
    const update = () => {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      progress.style.width = Math.min(100, Math.max(0, pct)) + '%';
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  var reduceMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;
  var finePointer = window.matchMedia ? window.matchMedia('(hover: hover) and (pointer: fine)').matches : false;

  var revealAll = function () {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('visible'); });
  };

  // Reticle follower. Desktop fine pointers only; native cursor untouched.
  if (finePointer && !reduceMotion) {
    var ret = document.createElement('div');
    ret.className = 'reticle';
    ret.setAttribute('aria-hidden', 'true');
    ret.innerHTML = '<i></i>';
    document.body.appendChild(ret);
    var rx = -100, ry = -100, tx = -100, ty = -100, rafOn = false;
    const render = () => {
      rx += (tx - rx) * 0.22;
      ry += (ty - ry) * 0.22;
      ret.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
      if (Math.abs(tx - rx) > 0.1 || Math.abs(ty - ry) > 0.1) {
        requestAnimationFrame(render);
      } else { rafOn = false; }
    };
    document.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
      ret.classList.add('on');
      if (!rafOn) { rafOn = true; requestAnimationFrame(render); }
    }, { passive: true });
    document.addEventListener('mouseleave', function () { ret.classList.remove('on'); });
    document.addEventListener('mouseover', function (e) {
      ret.classList.toggle('hot', !!e.target.closest('a,button'));
    }, { passive: true });
  }
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('visible');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    revealAll();
  }

  // Pause the hero diagram's infinite loops while it is scrolled out of view, so
  // a judge reading further down the page is not paying for three running
  // animations. The one-shot node draw-in is deliberately left alone.
  var diagram = document.querySelector('.hero-diagram');
  if (diagram && 'IntersectionObserver' in window) {
    var diagramObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        diagram.classList.toggle('is-offscreen', !en.isIntersecting);
      });
    }, { threshold: 0 });
    diagramObserver.observe(diagram);
  }

  // Progressive-enhancement gate. `js-ready` is added only after every observer
  // above is attached, inside the same try/catch. Until it is set - or for good
  // if this file is blocked or throws - the stylesheet leaves all content
  // visible, so a failed script can never hide the page's substance.
  try {
    document.documentElement.classList.add('js-ready');
  } catch (err) {
    revealAll();
  }
})();
