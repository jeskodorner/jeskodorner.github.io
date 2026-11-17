/**
 * Gleich hohe, randvolle Reihen „wie Lightroom“ für Listen mit [data-justify] – die Rechnung selbst.
 * Jedes Kind trägt sein Seitenverhältnis als CSS-Variable --r, die Zielhöhe einer Reihe kommt aus CSS (--row).
 * Optional --min-w: so schmal soll kein Foto werden (sonst wird z. B. ein Hochformat neben Querformaten winzig).
 *
 * Verteilt die Fotos so auf Reihen, dass JEDE Reihe die ganze Breite füllt – auch die letzte – und alle Reihen
 * insgesamt möglichst nah an der Zielhöhe bleiben (die Verteilung wird über die ganze Liste optimiert, nicht Reihe
 * für Reihe). Nur wenn ein Album so wenige Fotos hat, dass sie randvoll höher als der Bildschirm würden (z. B. ein
 * einzelnes Hochformat), bleibt rechts Platz.
 *
 * Bewusst einfaches JavaScript ohne import/export: Dieselbe Datei steht
 *   1. direkt nach der Fotoliste im HTML (JustifyNow.astro) – so sind die Reihen schon beim ersten Bild fertig,
 *      nichts springt und nichts muss versteckt werden (schneller sichtbar),
 *   2. im Skript justify.ts, das bei Größenänderungen und neu eingefügten Fotos neu verteilt.
 * Sie stellt die Funktion als window.jdLayout(liste) bereit.
 * Ohne JavaScript übernimmt reines CSS (flex-grow), dann ist nur die letzte Reihe nicht gestreckt.
 */
(function () {
  /** So hoch darf eine Reihe höchstens werden: das Größere aus Zielhöhe × MAX_GROW und 80 % der Fensterhöhe */
  var MAX_GROW = 1.9;
  var MAX_VIEWPORT = 0.8;
  /** Höchstens so viel kleiner (mehr Fotos passen dann nicht in eine Reihe) */
  var MIN_SHRINK = 0.55;
  /** Wie stark ein zu schmales Foto bestraft wird (im Vergleich zur Abweichung von der Zielhöhe) */
  var NARROW_WEIGHT = 8;

  /** Eine CSS-Länge (z. B. var(--row)) in Pixeln, über ein unsichtbares Messelement */
  function measure(list, value) {
    var probe = document.createElement('div');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText = 'position:absolute;visibility:hidden;height:0;padding:0;border:0;width:' + value;
    list.append(probe);
    var px = probe.getBoundingClientRect().width;
    probe.remove();
    return px;
  }

  function layout(list) {
    var width = list.clientWidth;
    if (!width) return; // ausgeblendet
    var items = Array.prototype.filter.call(list.children, function (el) {
      return el instanceof HTMLElement;
    });
    if (!items.length) return;

    var target = measure(list, 'var(--row)');
    if (!target || !isFinite(target)) return;
    var minW = Math.min(measure(list, 'var(--min-w, 0px)'), width);
    var gap = parseFloat(getComputedStyle(list).columnGap) || 0;

    // Breite eines Fotos pro Pixel Reihenhöhe = Seitenverhältnis
    var units = items.map(function (el) {
      return Number(el.style.getPropertyValue('--r')) || 1;
    });
    var n = units.length;
    var avail = width - 1; // Rundungsreserve, damit nichts umbricht
    var maxH = Math.max(target * MAX_GROW, window.innerHeight * MAX_VIEWPORT);
    var minH = target * MIN_SHRINK;

    // best[i] = kleinste Abweichung, um die ersten i Fotos auf volle Reihen zu verteilen
    var best = new Array(n + 1).fill(Infinity);
    var from = new Array(n + 1).fill(0);
    best[0] = 0;
    for (var i = 1; i <= n; i++) {
      var sum = 0;
      var narrowest = Infinity;
      for (var j = i - 1; j >= 0; j--) {
        sum += units[j];
        narrowest = Math.min(narrowest, units[j]);
        var k = i - j;
        var h = (avail - gap * (k - 1)) / sum;
        if (h < minH && k > 1) break; // noch mehr Fotos machen die Reihe nur flacher
        var dev = Math.log(h / target);
        // Zu schmale Fotos bestrafen (z. B. ein Hochformat zwischen Querformaten)
        var thin = minW > 0 ? Math.max(0, Math.log(minW / (Math.min(h, maxH) * narrowest))) : 0;
        // Zu hohe Reihen stark bestrafen, damit sie nur vorkommen, wenn es gar nicht anders geht
        var cost = dev * dev + NARROW_WEIGHT * thin * thin + (h > maxH ? 50 + dev : 0);
        if (best[j] + cost < best[i]) {
          best[i] = best[j] + cost;
          from[i] = j;
        }
      }
    }

    // Reihen aus der Rückverfolgung zusammensetzen
    var rows = [];
    for (var e = n; e > 0; e = from[e]) rows.unshift([from[e], e]);

    rows.forEach(function (row) {
      var a = row[0];
      var z = row[1];
      var s = 0;
      for (var x = a; x < z; x++) s += units[x];
      var full = (avail - gap * (z - a - 1)) / s;
      var rh = Math.min(full, maxH);
      var fill = rh === full;
      for (var y = a; y < z; y++) {
        var w = Math.floor(units[y] * rh * 100) / 100;
        // Volle Reihen schließen die letzten Bruchteile eines Pixels per flex-grow (anteilig, Format bleibt)
        items[y].style.flex = fill ? units[y] + ' 1 ' + w + 'px' : '0 0 ' + w + 'px';
      }
    });
    list.dataset.justified = '';
  }

  window.jdLayout = layout;
})();
