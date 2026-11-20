/*
 * Sun loader
 * 47 watercolour frames (taken from Saumya's original animation) in an 8 x 6 sprite.
 *
 * Frames are spread evenly over 0-100%: each frame covers 100 / 47 ≈ 2.13%.
 *   frame = floor(percent / 100 * 47), capped at frame 47 for 100%.
 * The shown percentage counts up 1% at a time toward the real loading progress,
 * so the frames change gradually and never skip. A full 0-100 run takes at least
 * MIN_RUN_MS (the length of the original animation).
 *
 * Public API (optional, for pages that know their own progress):
 *   SunLoader.set(0-100)   SunLoader.done()
 */
(function () {
  var FRAMES = 47, COLS = 8, ROWS = 6, MIN_RUN_MS = 2800, HOLD_MS = 450;
  var MS_PER_PERCENT = MIN_RUN_MS / 100;

  var root = document.getElementById("sun-loader");
  if (!root) return;
  var art = root.querySelector(".sun-loader__art");
  var pct = root.querySelector(".sun-loader__pct");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var target = 0, shown = 0, frame = -1, carry = 0, last = 0, finished = false;

  function frameFor(p) { return Math.min(FRAMES - 1, Math.floor((p / 100) * FRAMES)); }

  function paint() {
    var f = frameFor(shown);
    if (f !== frame) {
      frame = f;
      var c = f % COLS, r = Math.floor(f / COLS);
      art.style.backgroundPosition = (c / (COLS - 1)) * 100 + "% " + (r / (ROWS - 1)) * 100 + "%";
    }
    pct.firstChild.nodeValue = shown;
    root.setAttribute("aria-valuenow", shown);
  }

  function tick(t) {
    if (finished) return;
    var dt = last ? t - last : 0;
    last = t;
    if (shown < target) {
      carry += dt;
      var steps = Math.floor(carry / MS_PER_PERCENT);
      if (steps > 0) {
        carry -= steps * MS_PER_PERCENT;
        shown = Math.min(Math.floor(target), shown + steps);
        paint();
      }
    } else {
      carry = 0;
    }
    if (shown >= 100) return finish();
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

  // Real progress: the sprite, web fonts, images on the page, and the window load event.
  var tasks = 0, doneTasks = 0;
  function track(promise) { tasks++; promise.then(step, step); }
  function step() { doneTasks++; set((doneTasks / Math.max(tasks, 1)) * 95); }

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
