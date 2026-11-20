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
  var TURN = [[61.57,-10.38,42.95,74.68],[61.57,-10.37,42.95,74.97],[61.55,-10.37,43.08,75.28],[61.53,-10.36,43.32,75.6],[61.49,-10.35,43.68,75.94],[61.44,-10.34,44.15,76.28],[61.38,-10.33,44.74,76.63],[61.31,-10.32,45.43,76.99],[61.23,-10.3,46.23,77.34],[61.14,-10.29,47.13,77.69],[61.04,-10.27,48.12,78.03],[60.94,-10.25,49.2,78.36],[60.83,-10.23,50.36,78.67],[60.71,-10.21,51.59,78.96],[60.58,-10.18,52.88,79.22],[60.46,-10.15,54.22,79.46],[60.32,-10.12,55.61,79.66],[60.19,-10.08,57.02,79.83],[60.05,-10.04,58.46,79.95],[59.91,-9.99,59.91,80.04]];
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
