/*
 * Sections 4-6: reveal blocks as they scroll in, and let the
 * feedback and photo rails be dragged sideways with a mouse.
 */
(function () {
  var items = document.querySelectorAll(".shore .rv");
  if (!("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    items.forEach(function (el) { io.observe(el); });
  }

  document.querySelectorAll(".shore .rail").forEach(function (rail) {
    var startX = 0, startLeft = 0, down = false, moved = false;
    rail.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      down = true; moved = false; startX = e.clientX; startLeft = rail.scrollLeft;
    });
    window.addEventListener("pointermove", function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 4) { moved = true; rail.classList.add("is-dragging"); }
      if (moved) rail.scrollLeft = startLeft - dx;
    });
    window.addEventListener("pointerup", function () {
      if (!down) return;
      down = false;
      if (!moved) return;
      rail.classList.remove("is-dragging");
      // settle on the nearest card
      var w = rail.firstElementChild.getBoundingClientRect().width;
      var gap = parseFloat(getComputedStyle(rail).columnGap) || 0;
      rail.scrollTo({ left: Math.round(rail.scrollLeft / (w + gap)) * (w + gap), behavior: "smooth" });
    });
  });

  // Footer links still waiting on their addresses do nothing yet.
  document.querySelectorAll(".foot a[data-todo]").forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); });
  });
})();
