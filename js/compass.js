/*
 * Compass rose on the map: the dial behaves like a real compass needle.
 * - Its N point swings towards the pointer as it moves over the page, with a springy wobble.
 * - Drag it to spin it; let go and it keeps spinning, then settles.
 * - Left alone, it drifts back to north.
 */
(function () {
  var rose = document.querySelector(".mapl__rose");
  var dial = rose && rose.querySelector(".mapl__rose-dial");
  if (!dial) return;
  var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var angle = 0, vel = 0, target = 0;   // degrees
  var dragging = false, lastDrag = 0, lastTime = 0;
  var idleTimer = null, running = false;

  function centre() {
    var r = dial.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width };
  }
  function pointerAngle(e) {
    var c = centre();
    return Math.atan2(e.clientX - c.x, c.y - e.clientY) * 180 / Math.PI;
  }
  function wrap(d) { return ((d + 540) % 360) - 180; }
  function onScreen() {
    var r = rose.getBoundingClientRect();
    return r.bottom > 0 && r.top < innerHeight && getComputedStyle(rose).opacity > 0.05;
  }

  function draw() { dial.style.setProperty("--rose", angle.toFixed(2) + "deg"); }

  function tick(t) {
    var dt = Math.min(0.05, (t - (lastTime || t)) / 1000) || 0.016;
    lastTime = t;
    if (!dragging) {
      // spring towards the target with light damping, so it overshoots and wobbles like a needle
      var acc = wrap(target - angle) * 60 - vel * 5.5;
      vel += acc * dt;
      angle += vel * dt;
    }
    draw();
    if (dragging || Math.abs(vel) > 0.3 || Math.abs(wrap(target - angle)) > 0.3) {
      requestAnimationFrame(tick);
    } else {
      running = false; lastTime = 0;
    }
  }
  function kick() {
    if (still) { angle = target; draw(); return; }
    if (!running) { running = true; requestAnimationFrame(tick); }
  }
  function settleLater() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () { target = 0; kick(); }, 2500);
  }

  // follow the pointer while the map is in view
  // only catch clicks once the map has faded in
  function arm() { rose.style.pointerEvents = onScreen() ? "auto" : "none"; }
  window.addEventListener("scroll", arm, { passive: true }); arm();

  window.addEventListener("pointermove", function (e) {
    if (dragging || e.pointerType === "touch") return;
    arm();
    if (!onScreen()) return;
    var c = centre();
    if (Math.hypot(e.clientX - c.x, e.clientY - c.y) < c.w * 0.2) return; // too close to read a heading
    target = angle + wrap(pointerAngle(e) - angle);
    kick(); settleLater();
  }, { passive: true });

  // drag to spin
  rose.addEventListener("pointerdown", function (e) {
    dragging = true; rose.classList.add("is-dragging");
    rose.setPointerCapture(e.pointerId);
    lastDrag = pointerAngle(e); vel = 0; lastTime = performance.now();
    clearTimeout(idleTimer); kick();
    e.preventDefault();
  });
  rose.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    var a = pointerAngle(e), d = wrap(a - lastDrag), now = performance.now();
    var dt = Math.max(0.008, (now - lastTime) / 1000);
    angle += d; vel = vel * 0.6 + (d / dt) * 0.4; lastDrag = a; lastTime = now;
    draw();
  });
  function release() {
    if (!dragging) return;
    dragging = false; rose.classList.remove("is-dragging");
    // let the spin carry on, then come to rest pointing wherever it was flung towards
    target = angle + Math.max(-540, Math.min(540, vel * 0.35));
    lastTime = 0; kick(); settleLater();
  }
  rose.addEventListener("pointerup", release);
  rose.addEventListener("pointercancel", release);
})();
