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
 *   --exit  the hero copy lifts away and the side-view ship sails off to the left
 *   --rise  the back-view ship rises on the same sea and the journey heading appears
 *   --tools the tool stack tiles arrive one by one
 * and draws the route across the map, lighting each port as the line reaches it.
 * Phones get a plain stacked section instead (see css), so nothing runs there.
 */
(function () {
  var voyage = document.querySelector(".voyage");
  var hero = document.querySelector(".hero");
  var reveal = document.querySelector(".route__reveal");
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
  }
  function onScroll() { if (!queued) { queued = true; requestAnimationFrame(update); } }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();
