(function () {
  var slides = window.KINN_SLIDES || [];
  var deck = document.getElementById('deck');
  var dotsEl = document.getElementById('nav-dots');
  var counter = document.getElementById('slide-counter');
  var btnPrev = document.getElementById('nav-prev');
  var btnNext = document.getElementById('nav-next');
  var current = 0;

  // Build DOM
  slides.forEach(function (s, i) {
    var el = document.createElement('section');
    el.className = 'slide' + (i === 0 ? ' active' : '');
    el.dataset.theme = s.theme || 'light';
    el.innerHTML = s.render();
    deck.appendChild(el);

    var dot = document.createElement('button');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', 'Slide ' + (i + 1));
    dot.addEventListener('click', (function (n) { return function () { go(n); }; })(i));
    dotsEl.appendChild(dot);
  });

  function go(n) {
    if (n < 0 || n >= slides.length) return;
    var els = deck.querySelectorAll('.slide');
    var dots = dotsEl.querySelectorAll('.dot');
    els[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = n;
    els[current].classList.add('active');
    dots[current].classList.add('active');

    var total = slides.length;
    counter.textContent = (current + 1) + ' / ' + total;

    var theme = slides[current].theme || 'light';
    var dark = theme === 'dark';
    var mint = theme === 'mint';
    var navColor = (dark || mint) ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.25)';
    var cntColor = (dark || mint) ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)';
    var bgColor = (dark || mint) ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
    btnPrev.style.color = navColor;
    btnNext.style.color = navColor;
    btnPrev.style.background = bgColor;
    btnNext.style.background = bgColor;
    counter.style.color = cntColor;

    btnPrev.disabled = current === 0;
    btnNext.disabled = current === slides.length - 1;
  }

  go(0);

  // Keyboard
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); go(current + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(current - 1); }
    if (e.key === 'Home') { e.preventDefault(); go(0); }
    if (e.key === 'End') { e.preventDefault(); go(slides.length - 1); }
  });

  // Click (left half = prev, right half = next) — but not on nav buttons
  deck.addEventListener('click', function (e) {
    if (e.target.closest('#nav-prev, #nav-next, .dot')) return;
    if (e.clientX > window.innerWidth / 2) go(current + 1);
    else go(current - 1);
  });

  // Touch swipe
  var touchStartX = null;
  deck.addEventListener('touchstart', function (e) { touchStartX = e.touches[0].clientX; }, { passive: true });
  deck.addEventListener('touchend', function (e) {
    if (touchStartX === null) return;
    var dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) go(current + (dx < 0 ? 1 : -1));
    touchStartX = null;
  }, { passive: true });

  btnPrev.addEventListener('click', function (e) { e.stopPropagation(); go(current - 1); });
  btnNext.addEventListener('click', function (e) { e.stopPropagation(); go(current + 1); });
})();
