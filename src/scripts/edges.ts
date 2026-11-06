/**
 * Parallax für das Vignetting (.edge, siehe global.css „Vignetting“): Beim Scrollen wandern die Wolken
 * langsamer als der Inhalt nach oben – links etwas schneller als rechts, das gibt Tiefe.
 * Das Wolkenmuster wiederholt sich alle --tile Pixel; deshalb reicht ein Versatz innerhalb einer Kachel.
 * Nur transform (läuft auf der Grafikkarte, kein Neuzeichnen). Bei „Bewegung reduzieren“ steht alles still.
 */
const SPEED = { left: 0.34, right: 0.24 };

export function initEdges() {
  const edges = [...document.querySelectorAll<HTMLElement>('.edge')];
  if (!edges.length) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const speeds = edges.map((el) => (el.classList.contains('edge--right') ? SPEED.right : SPEED.left));

  let tile = 1536;
  let queued = false;
  const measure = () => {
    tile = parseFloat(getComputedStyle(edges[0]!).getPropertyValue('--tile')) || tile;
  };
  const update = () => {
    queued = false;
    edges.forEach((el, i) => {
      if (reduce.matches) {
        el.style.removeProperty('transform');
        return;
      }
      const y = (window.scrollY * speeds[i]!) % tile;
      el.style.transform = `translate3d(0, ${(-y).toFixed(1)}px, 0)`;
    });
  };
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };

  measure();
  update();
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', () => {
    measure();
    schedule();
  });
  reduce.addEventListener('change', schedule);
}
