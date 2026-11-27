/*
 * Treasure map: each island opens its port card; the hint cursor goes once someone tries an
 * island.
 */
(function () {
  var card = document.querySelector(".port-card");
  if (!card) return;
  var fields = {
    img: card.querySelector(".port-card__img"),
    kicker: card.querySelector(".port-card__kicker"),
    title: card.querySelector(".port-card__title"),
    text: card.querySelector(".port-card__text"),
    cta: card.querySelector(".port-card__cta")
  };
  var opener = null;

  function explored() { document.documentElement.classList.add("map-explored"); }
  Array.prototype.forEach.call(document.querySelectorAll(".island"), function (btn) {
    btn.addEventListener("pointerenter", explored);
    btn.addEventListener("focus", explored);
    btn.addEventListener("click", function () {
      explored();
      opener = btn;
      fields.img.src = btn.dataset.img;
      fields.kicker.textContent = btn.dataset.kicker || "";
      fields.kicker.hidden = !btn.dataset.kicker;
      if (fields.cta) fields.cta.hidden = !btn.dataset.cta;
      fields.title.textContent = btn.dataset.title;
      fields.text.textContent = btn.dataset.text;
      if (typeof card.showModal === "function") card.showModal(); else card.setAttribute("open", "");
    });
  });
  // a click on the dimmed backdrop closes the card
  card.addEventListener("click", function (e) {
    if (e.target !== card) return;
    var r = card.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) card.close();
  });
  card.addEventListener("close", function () { if (opener) opener.focus(); });

})();
