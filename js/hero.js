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
 * Voyage: the hero stays pinned for the length of .voyage. Scrolling sails the hero ship away
 * (--exit) and brings the treasure map in over the same sky and sea (--enter), both 0 to 1 on .hero.
 * Phones and portrait screens stack the sections instead (see css), so nothing runs there.
 */
(function () {
  var voyage = document.querySelector(".voyage");
  var hero = document.querySelector(".hero");
  if (!voyage || !hero) return;
  var box = document.querySelector(".mapl__box"), scene = hero.querySelector(".scene");
  var stacked = window.matchMedia("(max-aspect-ratio: 1/1), (max-width: 760px)");
  function seg(p, a, b) { var v = Math.min(1, Math.max(0, (p - a) / (b - a))); return v * v * (3 - 2 * v); }
  window.SagaVoyage = { exit: 0 };   // the sea stays put: both scenes share it

  var queued = false;
  function update() {
    queued = false;
    if (stacked.matches) {
      hero.style.removeProperty("--exit"); hero.style.removeProperty("--enter"); hero.classList.remove("is-map");
      return;
    }
    var total = voyage.offsetHeight - window.innerHeight;
    var p = total > 0 ? Math.min(1, Math.max(0, -voyage.getBoundingClientRect().top / total)) : 0;
    var exit = seg(p, 0, 0.42), enter = seg(p, 0.22, 0.85);
    hero.style.setProperty("--exit", exit.toFixed(4));
    hero.style.setProperty("--enter", enter.toFixed(4));
    hero.classList.toggle("is-map", enter > 0.85);   // islands answer clicks once they have arrived
  }
  function onScroll() { if (!queued) { queued = true; requestAnimationFrame(update); } }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();
