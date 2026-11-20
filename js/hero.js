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
