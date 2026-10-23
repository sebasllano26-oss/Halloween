import { gsap } from 'gsap';

// Each rendered screen owns its animations and removes them before navigation.
export function mountMotion(root, { enabled, view, keyboard = false, direction = 1 } = {}) {
  if (!enabled || keyboard || typeof window.requestAnimationFrame !== 'function') return () => {};
  const media = gsap.matchMedia();
  const context = gsap.context(() => {
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const enter = gsap.timeline({ defaults: { ease: 'power3.out', duration: .5 } });
      const select = selector => Array.from(root.querySelectorAll(selector));
      if (view === 'home') {
        enter.from(select('.cinema-kicker'), { y: 10, opacity: 0, duration: .4 })
          .from(select('.title-line'), { y: 24, opacity: 0, stagger: .07, duration: .65 }, '-=.26')
          .from(select('.cinema-description, .cinema-actions, .hero-assurance, .family-cast'), { y: 12, opacity: 0, stagger: .06 }, '-=.42')
          .from(select('.gold-ticket'), { y: 20, rotation: 2, opacity: 0, duration: .7 }, '-=.5');
        select('.mist-layer').forEach((mist, i) => gsap.to(mist, { xPercent: i ? -10 : 10, opacity: i ? .8 : .45, duration: 12 + i * 4, repeat: -1, yoyo: true, ease: 'sine.inOut' }));
        select('.fireflies i').forEach((light, i) => gsap.to(light, { y: -16 - i % 4 * 7, x: (i % 3 - 1) * 12, opacity: .12, duration: 2.7 + i % 5 * .5, delay: i * .13, repeat: -1, yoyo: true, ease: 'sine.inOut' }));
      } else if (view === 'identity') {
        enter.from(select('.invitation-form'), { y: 14, opacity: 0, duration: .4 })
          .from(select('.entry-caption'), { y: 10, opacity: 0, duration: .45 }, '-=.28');
      } else if (view === 'question') {
        enter.from(select('.question-copy, .options, .candidate-options'), { x: direction * 12, opacity: 0, stagger: .025, duration: .22 });
      } else if (view === 'review') {
        enter.from(select('.vote-certificate'), { y: 12, opacity: 0, duration: .35 });
      } else if (view === 'success') {
        enter.from(select('.success-companion'), { y: 16, opacity: 0, duration: .5 })
          .from(select('.receipt'), { y: 8, opacity: 0, duration: .35 }, '-=.25');
      } else if (view === 'winner') {
        enter.from(select('.winner-crown'), { y: -20, rotation: -8, opacity: 0, duration: .7 })
          .from(select('.winner-art, .winner-card h2'), { y: 18, opacity: 0, stagger: .1 }, '-=.3')
          .from(select('.rank-fill'), { scaleX: 0, transformOrigin: 'left', stagger: .06, duration: .7 }, '-=.2');
      }
      const companions = select('.hero-spirit');
      if (companions.length) gsap.to(companions, { y: -7, rotation: .8, duration: 3.3, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    });
    media.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      const hero = root.querySelector('.cinema-hero'), poster = root.querySelector('.hero-poster');
      if (!hero || !poster) return;
      const xTo = gsap.quickTo(poster, 'x', { duration: .85, ease: 'power3.out' });
      const yTo = gsap.quickTo(poster, 'y', { duration: .85, ease: 'power3.out' });
      const move = event => { const box = hero.getBoundingClientRect(); xTo((event.clientX - box.left - box.width / 2) / box.width * 12); yTo((event.clientY - box.top - box.height / 2) / box.height * 8); };
      const leave = () => { xTo(0); yTo(0); };
      hero.addEventListener('pointermove', move); hero.addEventListener('pointerleave', leave);
      return () => { hero.removeEventListener('pointermove', move); hero.removeEventListener('pointerleave', leave); };
    });
  }, root);
  return () => { media.revert(); context.revert(); };
}

// Keep the next action in the same place while long questions can still scroll.
export function mountQuestionDock(root) {
  const card = root.querySelector('.question-card'), dock = card?.querySelector('.question-dock');
  if (!dock) return () => {};
  const update = () => {
    const box = card.getBoundingClientRect();
    if (!box.width) return;
    const inset = window.innerWidth <= 600 ? 8 : 12;
    dock.style.left = `${box.left + inset}px`;
    dock.style.width = `${box.width - inset * 2}px`;
    dock.classList.add('is-docked');
  };
  update();
  window.addEventListener('resize', update);
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(update) : null;
  observer?.observe(card);
  window.visualViewport?.addEventListener('resize', update);
  return () => { window.removeEventListener('resize', update); window.visualViewport?.removeEventListener('resize', update); observer?.disconnect(); };
}
