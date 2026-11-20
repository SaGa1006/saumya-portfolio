/*
 * Hero scene: start the ship's entry once the sun loader has faded,
 * and pause the scene's loops while it is off screen.
 */
(function () {
  var hero = document.querySelector(".hero");
  var scene = document.querySelector(".scene");
  if (!hero || !scene) return;

  function sail() { hero.classList.add("is-sailing"); }
  if (document.documentElement.classList.contains("is-loading")) {
    document.addEventListener("sunloader:done", sail, { once: true });
  } else {
    sail();
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      scene.classList.toggle("is-paused", !entries[0].isIntersecting);
    }).observe(scene);
  }
})();

/*
 * Voyage: while the hero is pinned, scroll progress drives three 0-1 values on .hero
 *   --exit  the hero copy lifts away while the boat turns toward the viewer (painted turn frames) and glides to the centre
 *   --rise  the journey heading appears
 *   --tools the tool stack tiles arrive one by one
 * and draws the route across the map, lighting each port as the line reaches it.
 * Phones get a plain stacked section instead (see css), so nothing runs there.
 */
(function () {
  var voyage = document.querySelector(".voyage");
  var hero = document.querySelector(".hero");
  var reveal = document.querySelector(".route__reveal");
  var scene = document.querySelector(".scene"), shipExit = document.querySelector(".ship-exit");
  var ship = document.querySelector(".ship"), bob = document.querySelector(".ship__bob");
  var hull = document.querySelector(".ship__hull"), frames = document.querySelector(".ship__frames");
  // per frame of the turn: mast top (x, y) and deck spot under the crew (x, y), in % of the ship box
  var TURN = [[62.04,-9.75,48.97,75.95],[62.03,-9.75,48.98,76.16],[62.01,-9.75,49.07,76.37],[61.98,-9.76,49.24,76.58],[61.94,-9.76,49.49,76.78],[61.89,-9.76,49.81,76.98],[61.83,-9.77,50.21,77.17],[61.76,-9.77,50.68,77.36],[61.68,-9.77,51.22,77.53],[61.59,-9.77,51.82,77.7],[61.49,-9.78,52.49,77.85],[61.39,-9.78,53.21,77.99],[61.27,-9.78,53.99,78.12],[61.16,-9.78,54.81,78.23],[61.03,-9.78,55.67,78.33],[60.9,-9.78,56.57,78.41],[60.77,-9.79,57.49,78.47],[60.64,-9.79,58.44,78.52],[60.5,-9.79,59.39,78.54],[60.36,-9.79,60.36,78.55]];
  var FLAG0 = [58.2, -2.3];   // where the flag hangs on the painted hero ship
  var turnLoaded = false;
  function loadTurn() { if (!turnLoaded && frames) { turnLoaded = true; frames.style.backgroundImage = "url(assets/hero/ship-turn.webp)"; } }
  if (!voyage || !hero || !reveal) return;
  var stacked = window.matchMedia("(max-aspect-ratio: 1/1), (max-width: 760px)");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var L = reveal.getTotalLength();
  reveal.style.strokeDasharray = L + " " + L;
  // how far along the route each port sits (0-1), by the nearest sampled point
  var ports = Array.prototype.map.call(document.querySelectorAll(".port"), function (el) {
    var x = +el.getAttribute("data-x"), y = +el.getAttribute("data-y"), best = 0, bestD = Infinity;
    for (var s = 0; s <= 400; s++) {
      var pt = reveal.getPointAtLength((s / 400) * L), d = (pt.x - x) * (pt.x - x) + (pt.y - y) * (pt.y - y);
      if (d < bestD) { bestD = d; best = s / 400; }
    }
    return { el: el, f: best };
  });

  function seg(p, a, b) { var v = Math.min(1, Math.max(0, (p - a) / (b - a))); return v * v * (3 - 2 * v); }
  window.SagaVoyage = { exit: 0 };

  var queued = false;
  function update() {
    queued = false;
    if (stacked.matches) {
      ["--exit", "--rise", "--tools"].forEach(function (k) { hero.style.removeProperty(k); });
      window.SagaVoyage.exit = 0;
      if (shipExit) shipExit.style.transform = "";
      if (hull) hull.style.opacity = "";
      if (bob) ["--fx", "--fy", "--px", "--py"].forEach(function (k) { bob.style.removeProperty(k); });
      return;
    }
    var total = voyage.offsetHeight - window.innerHeight;
    var p = total > 0 ? Math.min(1, Math.max(0, -voyage.getBoundingClientRect().top / total)) : 0;
    var exit = seg(p, 0, 0.28), rise = seg(p, 0.2, 0.48), route = seg(p, 0.42, 0.8), tools = seg(p, 0.78, 0.97);
    hero.style.setProperty("--exit", exit.toFixed(4));
    hero.style.setProperty("--rise", rise.toFixed(4));
    hero.style.setProperty("--tools", tools.toFixed(4));
    if (reduce) route = route > 0 ? 1 : 0;
    reveal.style.strokeDashoffset = (L * (1 - route)).toFixed(1);
    ports.forEach(function (pt) { pt.el.classList.toggle("is-on", route > 0 && route >= pt.f - 0.002); });
    window.SagaVoyage.exit = exit;
    // glide the boat from its hero spot to the centre of the screen, sinking with the sea rows
    if (shipExit && scene) {
      var r = scene.getBoundingClientRect(), k = r.width / 1920;
      var dx = window.innerWidth / 2 - (r.left + 1297 * k);   // 1297 = boat centre on the artboard
      var dy = 55 * k;                                        // how far the rows at the hull drop
      shipExit.style.transform = "translate3d(" + (dx * exit).toFixed(1) + "px," + (dy * exit).toFixed(1) + "px,0)";
    }
    // swap the flat hero painting for the painted turn frames, and keep the flag and crew on board
    if (frames && hull && bob && ship) {
      if (exit > 0) loadTurn();
      var swap = Math.min(1, exit / 0.05);
      var f = Math.round(exit * (TURN.length - 1)), t = TURN[f];
      frames.style.opacity = swap.toFixed(3);
      hull.style.opacity = (1 - swap).toFixed(3);
      frames.style.backgroundPosition = (f % 5) * 25 + "% " + Math.floor(f / 5) * (100 / 3) + "%";
      var w = ship.offsetWidth / 100, h = ship.offsetHeight / 100;
      bob.style.setProperty("--fx", ((t[0] - FLAG0[0]) * w * swap).toFixed(1) + "px");
      bob.style.setProperty("--fy", ((t[1] - FLAG0[1]) * h * swap).toFixed(1) + "px");
      bob.style.setProperty("--px", ((t[2] - TURN[0][2]) * w).toFixed(1) + "px");
      bob.style.setProperty("--py", ((t[3] - TURN[0][3]) * h).toFixed(1) + "px");
    }
  }
  function onScroll() { if (!queued) { queued = true; requestAnimationFrame(update); } }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();
