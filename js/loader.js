/*
 * Sun loader
 * 47 watercolour frames (taken from Saumya's original animation, 17 fps) in an 8 x 6 sprite.
 * Each frame is tied to real loading progress, but frames never advance faster than the
 * original 17 fps, so the sun always paints itself in as a hand-drawn sequence.
 *
 * Public API (optional, for pages that know their own progress):
 *   SunLoader.set(0-100)   SunLoader.done()
 */
(function () {
  var FRAMES = 47, COLS = 8, ROWS = 6, FPS = 17, HOLD_MS = 450;

  var root = document.getElementById("sun-loader");
  if (!root) return;
  var art = root.querySelector(".sun-loader__art");
  var pct = root.querySelector(".sun-loader__pct");
  var bar = root.querySelector(".sun-loader__bar i");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var target = 0, frame = 0, shown = 0, last = 0, finished = false;

  function frameFor(p) { return Math.min(FRAMES - 1, Math.floor((p / 100) * (FRAMES - 1) + 1e-4)); }

  function paint() {
    var c = frame % COLS, r = Math.floor(frame / COLS);
    art.style.backgroundPosition = (c / (COLS - 1)) * 100 + "% " + (r / (ROWS - 1)) * 100 + "%";
    var v = Math.round(shown);
    pct.firstChild.nodeValue = v;
    bar.style.setProperty("--p", v / 100);
    root.setAttribute("aria-valuenow", v);
  }

  function tick(t) {
    if (finished) return;
    if (t - last >= 1000 / FPS) {
      last = t;
      var want = frameFor(target);
      if (frame < want) frame++;
      shown = frame === want ? target : Math.max(shown, (frame / (FRAMES - 1)) * 100);
      paint();
      if (target >= 100 && frame === FRAMES - 1) return finish();
    }
    requestAnimationFrame(tick);
  }

  function finish() {
    finished = true;
    setTimeout(function () {
      root.classList.add("is-done");
      root.setAttribute("aria-hidden", "true");
      document.documentElement.classList.remove("is-loading");
      document.dispatchEvent(new CustomEvent("sunloader:done"));
    }, reduce ? 0 : HOLD_MS);
  }

  function set(p) { target = Math.max(target, Math.min(100, p)); }

  // Real progress: images on the page, web fonts, and the window load event.
  var tasks = 0, doneTasks = 0;
  function track(promise) {
    tasks++;
    promise.then(step, step);
  }
  function step() { doneTasks++; set((doneTasks / Math.max(tasks, 1)) * 95); }

  // The sprite itself must be ready before the sun can show.
  track(new Promise(function (res, rej) {
    var img = new Image();
    img.onload = res; img.onerror = rej;
    img.src = getComputedStyle(art).backgroundImage.replace(/^url\(["']?|["']?\)$/g, "");
  }));
  if (document.fonts && document.fonts.ready) track(document.fonts.ready);
  Array.prototype.forEach.call(document.images, function (img) {
    if (img.complete) return;
    track(new Promise(function (res) { img.addEventListener("load", res); img.addEventListener("error", res); }));
  });
  window.addEventListener("load", function () { set(100); });

  window.SunLoader = { set: set, done: function () { set(100); } };
  paint();
  requestAnimationFrame(tick);
})();
