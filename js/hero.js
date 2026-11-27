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
 * Voyage: the hero stays pinned while the treasure map slides up over it.
 *   --exit  on .hero: the hero copy lifts away and the sea rows drop (js/sea.js reads SagaVoyage.exit)
 *   --enter on .map: the map's layers settle at different speeds as it rises (parallax)
 * Phones and portrait screens stack the sections instead (see css), so nothing runs there.
 */
(function () {
  var hero = document.querySelector(".hero");
  var map = document.querySelector(".map");
  if (!hero || !map) return;
  var stacked = window.matchMedia("(max-aspect-ratio: 1/1), (max-width: 760px)");
  function ease(v) { v = Math.min(1, Math.max(0, v)); return v * v * (3 - 2 * v); }
  window.SagaVoyage = { exit: 0 };

  var queued = false;
  function update() {
    queued = false;
    if (stacked.matches) {
      hero.style.removeProperty("--exit"); map.style.removeProperty("--enter");
      window.SagaVoyage.exit = 0;
      return;
    }
    var vh = window.innerHeight, top = map.getBoundingClientRect().top;
    var enter = ease(1 - top / vh);            // 0 while the map is below the fold, 1 once it fills the screen
    hero.style.setProperty("--exit", enter.toFixed(4));
    map.style.setProperty("--enter", enter.toFixed(4));
    window.SagaVoyage.exit = enter;
  }
  function onScroll() { if (!queued) { queued = true; requestAnimationFrame(update); } }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();
