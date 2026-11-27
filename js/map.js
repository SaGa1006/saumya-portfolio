/*
 * Treasure map: each island opens its port card; the hint cursor goes once someone tries an
 * island; the map's loops pause while it is off screen.
 */
(function () {
  var map = document.querySelector(".map");
  var card = document.querySelector(".port-card");
  if (!map || !card) return;
  var fields = {
    img: card.querySelector(".port-card__img"),
    kicker: card.querySelector(".port-card__kicker"),
    title: card.querySelector(".port-card__title"),
    line: card.querySelector(".port-card__line"),
    text: card.querySelector(".port-card__text")
  };
  var opener = null;

  function explored() { map.classList.add("is-explored"); }
  Array.prototype.forEach.call(map.querySelectorAll(".island"), function (btn) {
    btn.addEventListener("pointerenter", explored);
    btn.addEventListener("focus", explored);
    btn.addEventListener("click", function () {
      explored();
      opener = btn;
      fields.img.src = btn.dataset.img;
      fields.kicker.textContent = btn.dataset.kicker;
      fields.title.textContent = btn.dataset.title;
      fields.line.textContent = btn.dataset.line;
      fields.text.textContent = btn.dataset.text;
      if (typeof card.showModal === "function") card.showModal(); else card.setAttribute("open", "");
    });
  });
  // a click on the dimmed backdrop closes the card
  card.addEventListener("click", function (e) { if (e.target === card) card.close(); });
  card.addEventListener("close", function () { if (opener) opener.focus(); });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      map.classList.toggle("is-paused", !entries[0].isIntersecting);
    }).observe(map);
  }
})();
