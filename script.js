(() => {
  'use strict';

  // --------------------------------------------------------------------------
  // Mobile menu
  // --------------------------------------------------------------------------
  const burgerBtn = document.getElementById('burger-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  if (burgerBtn && mobileMenu) {
    const toggleMenu = (open) => {
      burgerBtn.setAttribute('aria-expanded', String(open));
      mobileMenu.hidden = !open;
    };

    burgerBtn.addEventListener('click', () => {
      const isOpen = burgerBtn.getAttribute('aria-expanded') === 'true';
      toggleMenu(!isOpen);
    });

    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => toggleMenu(false));
    });
  }

  // --------------------------------------------------------------------------
  // Scroll reveal
  // --------------------------------------------------------------------------
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -30px 0px' }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  // --------------------------------------------------------------------------
  // Interactive Math & Compound Effect Visualizer
  // --------------------------------------------------------------------------
  const slider = document.getElementById('episodes-range');
  const episodesValue = document.getElementById('episodes-value');
  const classicClipsEl = document.getElementById('classic-clips');
  const viralClipsEl = document.getElementById('viral-clips');
  const viralPostsEl = document.getElementById('viral-posts');
  const scaleRatioEl = document.getElementById('scale-ratio');

  const areaViral = document.getElementById('chart-area-viral');
  const lineViral = document.getElementById('chart-line-viral');
  const lineClassic = document.getElementById('chart-line-classic');
  const dotsGroup = document.getElementById('chart-dots');
  const peakLabel = document.getElementById('chart-peak-label');

  const formatNum = (n) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');

  const pluralEpisodes = (n) => {
    if (n === 1) return '1 выпуск';
    if (n >= 2 && n <= 4) return `${n} выпуска`;
    return `${n} выпусков`;
  };

  const renderChart = (episodes) => {
    const classicPerEp = 25;
    const viralPerEp = 2000;
    const platforms = 2; // Instagram Reels + YouTube Shorts

    const classicMonth = episodes * classicPerEp;
    const viralMonth = episodes * viralPerEp;
    const viralPostsMonth = viralMonth * platforms;
    const totalSixMonths = viralPostsMonth * 6;

    if (episodesValue) episodesValue.textContent = pluralEpisodes(episodes);
    if (classicClipsEl) classicClipsEl.textContent = formatNum(classicMonth);
    if (viralClipsEl) viralClipsEl.textContent = formatNum(viralMonth);
    if (viralPostsEl) viralPostsEl.textContent = formatNum(viralPostsMonth);
    if (scaleRatioEl) {
      const ratio = Math.round(viralPostsMonth / classicMonth);
      scaleRatioEl.textContent = `×${ratio} публикаций на 2 площадках`;
    }

    if (!areaViral || !lineViral || !lineClassic || !dotsGroup) return;

    // 6-month illustrative compound curve vs linear curve
    // Coordinates inside larger viewBox 0 0 520 360
    const xStart = 28;
    const xEnd = 496;
    const yBottom = 308;
    const yTop = 36;
    const height = yBottom - yTop;
    const steps = 6;

    const viralPoints = [];
    const classicPoints = [];

    // Bold curve even at 1 episode, scaling cleanly up to 8 episodes
    const intensity = 0.78 + ((episodes - 1) / 7) * 0.22;
    const growthBase = 1.62;
    const maxCompound = Math.pow(growthBase, steps - 1);

    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const x = xStart + t * (xEnd - xStart);

      // Viral: pronounced exponential compound curve
      const rawViral = (Math.pow(growthBase, i) / maxCompound) * intensity;
      const yViral = yBottom - Math.max(0.06, rawViral) * height;
      viralPoints.push([x, yViral]);

      // Classic: flat low linear line
      const rawClassic = (0.03 + t * 0.1) * intensity;
      const yClassic = yBottom - rawClassic * height;
      classicPoints.push([x, yClassic]);
    }

    const toPath = (pts) =>
      pts
        .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
        .join(' ');

    const viralLinePath = toPath(viralPoints);
    const classicLinePath = toPath(classicPoints);
    const viralAreaPath = `${viralLinePath} L ${xEnd} ${yBottom} L ${xStart} ${yBottom} Z`;

    lineViral.setAttribute('d', viralLinePath);
    areaViral.setAttribute('d', viralAreaPath);
    lineClassic.setAttribute('d', classicLinePath);

    if (peakLabel) {
      const lastPt = viralPoints[viralPoints.length - 1];
      peakLabel.setAttribute('y', Math.max(18, lastPt[1] - 14).toFixed(1));
      peakLabel.textContent = `${formatNum(totalSixMonths)}+ публ. за 6 мес`;
    }

    // Render crisp square markers on viral points
    dotsGroup.innerHTML = '';
    viralPoints.forEach(([x, y], idx) => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const size = idx === steps - 1 ? 10 : 7;
      rect.setAttribute('x', (x - size / 2).toFixed(1));
      rect.setAttribute('y', (y - size / 2).toFixed(1));
      rect.setAttribute('width', String(size));
      rect.setAttribute('height', String(size));
      rect.setAttribute('fill', '#ffffff');
      dotsGroup.appendChild(rect);
    });
  };

  if (slider) {
    renderChart(Number(slider.value));
    slider.addEventListener('input', (e) => {
      renderChart(Number(e.target.value));
    });
  }

  // --------------------------------------------------------------------------
  // Showcase Reel Players (clean playback with zero overlays)
  // --------------------------------------------------------------------------
  const reelPlayers = document.querySelectorAll('[data-reel-player]');

  reelPlayers.forEach((player) => {
    const video = player.querySelector('video');
    const cover = player.querySelector('.reel-cover');
    if (!video || !cover) return;

    const activateAndPlay = () => {
      // Pause any other playing reel
      reelPlayers.forEach((other) => {
        if (other === player) return;
        const otherVideo = other.querySelector('video');
        if (otherVideo && !otherVideo.paused) {
          otherVideo.pause();
        }
      });

      player.classList.add('is-active');
      video.controls = true;
      video.play().catch(() => {
        // Fallback if browser blocks programmatic play: controls are already visible
      });
    };

    cover.addEventListener('click', activateAndPlay);

    video.addEventListener('ended', () => {
      video.controls = false;
      video.currentTime = 0;
      player.classList.remove('is-active');
    });
  });

  // --------------------------------------------------------------------------
  // Copy phone button
  // --------------------------------------------------------------------------
  const copyToast = document.getElementById('copy-toast');
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.getAttribute('data-copy');
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        if (copyToast) {
          copyToast.textContent = `Номер ${text} скопирован`;
          setTimeout(() => {
            copyToast.textContent = '';
          }, 2600);
        }
      } catch {
        window.location.href = `tel:${text.replace(/[^+\d]/g, '')}`;
      }
    });
  });
})();
