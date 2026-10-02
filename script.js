(() => {
  'use strict';

  const slides = [...document.querySelectorAll('.slide')];
  const prevButton = document.getElementById('prevButton');
  const nextButton = document.getElementById('nextButton');
  const currentSlide = document.getElementById('currentSlide');
  const totalSlides = document.getElementById('totalSlides');
  const progressBar = document.getElementById('progressBar');
  const progressTitle = document.getElementById('progressTitle');
  const announcer = document.getElementById('slideAnnouncer');
  const keyboardHint = document.getElementById('keyboardHint');

  const titles = [
    'ABERTURA', 'O PROBLEMA REAL', 'A OPORTUNIDADE', 'A PLATAFORMA',
    'MORUBI LIVE', 'MORUBI CRM', 'IMPACTO NA BASE', 'USO INTERNO',
    'MEMÓRIA EVOLUTIVA', 'DIFERENCIAL', 'PARCERIA', 'PILOTO',
    'POR QUE AGORA', 'PRÓXIMO PASSO'
  ];

  let activeIndex = 0;
  let isAnimating = false;
  let touchStartX = 0;
  let touchStartY = 0;
  let fitRequest = 0;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const formatNumber = value => String(value).padStart(2, '0');

  function applyFit(slide) {
    const inner = slide.querySelector('.slide__inner');
    if (!inner) return;

    inner.style.zoom = '';
    inner.style.transform = 'scale(1)';
    inner.style.width = '100%';
    inner.style.height = '100%';
    inner.scrollTop = 0;

    const slideWidth = slide.clientWidth;
    const slideHeight = slide.clientHeight;
    if (!slideWidth || !slideHeight) return;

    const fitsAt = scale => {
      inner.style.transform = `scale(${scale})`;
      inner.style.width = `${100 / scale}%`;
      inner.style.height = `${100 / scale}%`;
      return inner.scrollHeight * scale <= slideHeight + 1 &&
        inner.scrollWidth * scale <= slideWidth + 1;
    };

    if (fitsAt(1)) {
      inner.dataset.fit = '1.000';
      return;
    }

    let low = window.innerWidth <= 640 ? 0.68 : 0.76;
    let high = 1;

    if (!fitsAt(low)) low = 0.56;

    for (let step = 0; step < 9; step += 1) {
      const middle = (low + high) / 2;
      if (fitsAt(middle)) low = middle;
      else high = middle;
    }

    const finalScale = Math.max(0.56, low - 0.006);
    fitsAt(finalScale);
    inner.dataset.fit = finalScale.toFixed(3);
  }

  function fitAllSlides() {
    window.cancelAnimationFrame(fitRequest);
    fitRequest = window.requestAnimationFrame(() => slides.forEach(applyFit));
  }

  function updateUi() {
    currentSlide.textContent = formatNumber(activeIndex + 1);
    totalSlides.textContent = formatNumber(slides.length);
    progressBar.style.width = `${((activeIndex + 1) / slides.length) * 100}%`;
    progressTitle.textContent = titles[activeIndex];
    prevButton.disabled = activeIndex === 0;
    nextButton.disabled = activeIndex === slides.length - 1;
    announcer.textContent = `Slide ${activeIndex + 1} de ${slides.length}: ${titles[activeIndex]}`;
    document.title = `${formatNumber(activeIndex + 1)} · ${titles[activeIndex]} — Morubi + E3`;
    try {
      history.replaceState(null, '', `#${activeIndex + 1}`);
    } catch {
      location.hash = String(activeIndex + 1);
    }
  }

  function goToSlide(nextIndex) {
    const target = clamp(nextIndex, 0, slides.length - 1);
    if (target === activeIndex || isAnimating) return;

    isAnimating = true;
    const previous = slides[activeIndex];
    const next = slides[target];
    const movingForward = target > activeIndex;

    previous.classList.remove('is-active');
    previous.classList.toggle('is-leaving-left', movingForward);
    next.style.transform = movingForward ? 'translate3d(4%,0,0)' : 'translate3d(-4%,0,0)';
    next.classList.add('is-active');
    applyFit(next);

    requestAnimationFrame(() => {
      next.style.transform = '';
      next.querySelector('.slide__inner')?.scrollTo({ top: 0, behavior: 'instant' });
    });

    activeIndex = target;
    updateUi();

    window.setTimeout(() => {
      previous.classList.remove('is-leaving-left');
      isAnimating = false;
    }, 650);
  }

  function next() { goToSlide(activeIndex + 1); }
  function previous() { goToSlide(activeIndex - 1); }

  prevButton.addEventListener('click', previous);
  nextButton.addEventListener('click', next);

  document.addEventListener('keydown', event => {
    const targetTag = event.target?.tagName;
    if (targetTag === 'INPUT' || targetTag === 'TEXTAREA') return;

    if (['ArrowRight', 'PageDown', ' '].includes(event.key)) {
      event.preventDefault();
      next();
    } else if (['ArrowLeft', 'PageUp'].includes(event.key)) {
      event.preventDefault();
      previous();
    } else if (event.key === 'Home') {
      event.preventDefault();
      goToSlide(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      goToSlide(slides.length - 1);
    }
  });

  document.addEventListener('touchstart', event => {
    touchStartX = event.changedTouches[0].clientX;
    touchStartY = event.changedTouches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', event => {
    const deltaX = event.changedTouches[0].clientX - touchStartX;
    const deltaY = event.changedTouches[0].clientY - touchStartY;
    if (Math.abs(deltaX) > 54 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25) {
      deltaX < 0 ? next() : previous();
    }
  }, { passive: true });

  document.querySelectorAll('[data-copy]').forEach(button => {
    button.addEventListener('click', async () => {
      const text = button.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
        const original = button.textContent;
        button.textContent = 'COPIADO';
        window.setTimeout(() => { button.textContent = original; }, 1200);
      } catch {
        button.textContent = 'SELECIONE O TEXTO';
      }
    });
  });

  window.setTimeout(() => keyboardHint?.classList.add('is-hidden'), 5000);

  const hashIndex = Number.parseInt(location.hash.replace('#', ''), 10) - 1;
  if (Number.isInteger(hashIndex) && hashIndex > 0 && hashIndex < slides.length) {
    slides[0].classList.remove('is-active');
    slides[hashIndex].classList.add('is-active');
    activeIndex = hashIndex;
  }

  updateUi();
  fitAllSlides();
  window.addEventListener('resize', fitAllSlides, { passive: true });
  window.addEventListener('orientationchange', fitAllSlides, { passive: true });
  document.fonts?.ready.then(fitAllSlides);
})();
