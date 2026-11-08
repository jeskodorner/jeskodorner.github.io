/**
 * Bilderstapel (components/PhotoPile.astro): oberstes Foto wegziehen oder antippen → es fliegt zur Seite
 * und schiebt sich unten in den Stapel. Zurück-Knopf holt das unterste wieder nach oben. Tasten ← →.
 */
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function setup(pile: HTMLElement) {
  const stack = pile.querySelector<HTMLElement>('.pile-stack');
  const cards = [...pile.querySelectorAll<HTMLElement>('.pile-card')];
  const n = cards.length;
  if (!stack || n < 2) return;
  const nameEl = pile.querySelector<HTMLElement>('[data-pile-name]');
  const metaEl = pile.querySelector<HTMLElement>('[data-pile-meta]');
  const viewEl = pile.querySelector<HTMLAnchorElement>('[data-pile-view]');
  const countEl = pile.querySelector<HTMLElement>('[data-pile-count]');

  /** order[Position im Stapel] = Index des Abzugs; Position 0 liegt oben */
  let order = cards.map((_, i) => i);
  let busy = false;

  const layout = () => {
    order.forEach((ci, pos) => {
      const card = cards[ci]!;
      card.dataset.pos = String(pos);
      card.style.setProperty('--pos', String(pos));
      card.style.zIndex = String(n - pos);
    });
    const top = cards[order[0]!]!;
    if (nameEl) nameEl.textContent = top.dataset.name ?? '';
    if (metaEl) metaEl.textContent = top.dataset.sub ?? '';
    if (viewEl && top.dataset.href) viewEl.href = top.dataset.href;
    if (countEl) countEl.textContent = `${order[0]! + 1} / ${n}`;
  };

  // Mit JavaScript übernehmen Knöpfe und „Ansehen“ die Bedienung; die Abzüge selbst sind keine Links mehr
  for (const card of cards) {
    const a = card.querySelector('a');
    if (a) {
      a.tabIndex = -1;
      a.setAttribute('aria-hidden', 'true');
      a.draggable = false;
    }
  }
  stack.addEventListener('click', (e) => {
    if ((e.target as Element).closest('.pile-print')) e.preventDefault();
  });

  /** Oberstes Foto wegwerfen (dir: 1 = nach rechts, -1 = nach links) */
  const next = (dir = 1) => {
    if (busy) return;
    const ci = order[0]!;
    const card = cards[ci]!;
    order = [...order.slice(1), ci];
    if (reduced()) {
      card.classList.remove('is-dragging');
      card.style.removeProperty('transform');
      layout();
      return;
    }
    busy = true;
    // Die anderen rücken sofort nach, das geworfene bleibt kurz obenauf
    order.forEach((idx, pos) => {
      if (idx === ci) return;
      const c = cards[idx]!;
      c.style.setProperty('--pos', String(pos));
      c.style.zIndex = String(n - pos);
    });
    card.classList.remove('is-dragging');
    card.classList.add('is-flying');
    card.style.zIndex = String(n + 1);
    card.style.transform = `translate(-50%, -50%) translate(${dir * 115}%, -4%) rotate(${dir * 14}deg)`;
    layout();
    card.style.zIndex = String(n + 1);
    window.setTimeout(() => {
      // unten einschieben: unter alle anderen legen, dann zurück in die Ruhelage gleiten
      card.classList.remove('is-flying');
      card.style.zIndex = '0';
      card.style.removeProperty('transform');
      busy = false;
    }, 360);
  };

  /** Unterstes Foto von links zurück nach oben holen */
  const prev = () => {
    if (busy) return;
    const ci = order[n - 1]!;
    const card = cards[ci]!;
    order = [ci, ...order.slice(0, n - 1)];
    if (reduced()) return layout();
    busy = true;
    card.style.transition = 'none';
    card.style.transform = 'translate(-50%, -50%) translate(-115%, -4%) rotate(-14deg)';
    layout();
    void card.offsetWidth; // Startlage übernehmen, bevor die Bewegung beginnt
    card.style.removeProperty('transition');
    card.style.removeProperty('transform');
    window.setTimeout(() => (busy = false), 420);
  };

  pile.querySelector('[data-pile-next]')?.addEventListener('click', () => next(1));
  pile.querySelector('[data-pile-prev]')?.addEventListener('click', prev);
  pile.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') next(1);
    else if (e.key === 'ArrowLeft') prev();
    else return;
    e.preventDefault();
  });

  // Ziehen mit Maus oder Finger; kurzes Antippen = weiter
  let drag: { card: HTMLElement; id: number; x0: number; y0: number; dx: number; dy: number; t0: number; moved: boolean } | null =
    null;
  stack.addEventListener('pointerdown', (e) => {
    const card = (e.target as Element).closest<HTMLElement>('.pile-card');
    if (!card || card !== cards[order[0]!] || busy || e.button !== 0) return;
    drag = { card, id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0, t0: performance.now(), moved: false };
    card.setPointerCapture(e.pointerId);
  });
  stack.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag.dx = e.clientX - drag.x0;
    drag.dy = e.clientY - drag.y0;
    if (!drag.moved && Math.hypot(drag.dx, drag.dy) > 6) {
      drag.moved = true;
      drag.card.classList.add('is-dragging');
    }
    if (drag.moved) {
      drag.card.style.transform = `translate(-50%, -50%) translate(${drag.dx}px, ${drag.dy}px) rotate(calc(var(--rot) + ${drag.dx * 0.05}deg))`;
    }
  });
  const end = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    const { card, dx, moved, t0 } = drag;
    drag = null;
    const speed = Math.abs(dx) / Math.max(1, performance.now() - t0);
    if (!moved) return next(1);
    if (Math.abs(dx) > 90 || speed > 0.6) return next(dx < 0 ? -1 : 1);
    card.classList.remove('is-dragging');
    card.style.removeProperty('transform');
  };
  stack.addEventListener('pointerup', end);
  stack.addEventListener('pointercancel', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag.card.classList.remove('is-dragging');
    drag.card.style.removeProperty('transform');
    drag = null;
  });

  layout();
}

export function initPiles() {
  document.querySelectorAll<HTMLElement>('[data-pile]').forEach(setup);
}
