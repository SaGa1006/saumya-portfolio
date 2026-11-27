// Saal Bhar: the wooden pegboard calendar on ecce-calendar.html.
// A 7 x 6 grid of pegs. Each month the teacher re-hangs the date blocks so day 1 sits under
// the right weekday, swaps in painted festival blocks, and the children set the season,
// weather, moon and mood discs every morning.
(function () {
  "use strict";
  var YEAR = 2025; // the year the team mapped in the research boards
  var MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  var MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // The team's five colour-coded categories.
  var CATS = {
    holiday: "National holiday",
    fixed: "Fixed day",
    variable: "Moving festival",
    week: "Theme week",
    weekday: "Fixed weekday"
  };
  // theme weeks: "month-first day" -> last day
  var WEEK_END = { "2-22": 27, "4-16": 21, "9-1": 14, "11-20": 25, "12-18": 21 };

  // "Know your body better": one theme per month, from the research table.
  var BODY = [
    ["My Bones & Strength", "Body tracing with joints"],
    ["My Eyes & Senses", "Sensory tray, eye-spy"],
    ["My Skin & Colour", "Fingerprint painting, skin tone collage"],
    ["My Food & Digestion", "Fruit sorting, handwashing songs"],
    ["My Emotions", "Mood masks, emotion wheel"],
    ["My Breathing", "Balloon breathing, yoga"],
    ["My Energy", "Jump games, climb and balance set-ups"],
    ["My Voice & Ears", "Sound jars, microphone storytelling"],
    ["My Growth", "Growth wall, baby-to-now photos"],
    ["My Protection", "Germ vs soap role play"],
    ["My Family Body Tree", "Draw your family's noses and eyes"],
    ["My Body in Play", "Obstacle course, reaction games"]
  ];

  // [day, name, category, theme, activity, development goal]  (2025 dates)
  var E = [
    [[1, "New Year", "holiday", "New beginnings", "A 'what I will try this year' circle, one wish each", "Socio-emotional, Language"],
     [6, "Guru Gobind Singh's Birthday", "variable", "Courage & equality", "Story time on standing up for others", "Fine motor, Socio-emotional"],
     [12, "National Youth Day", "fixed", "Leadership", "Pretend play: 'line leader for a day'", "Cognitive, Socio-emotional"],
     [14, "Makar Sankranti · Pongal · Magh Bihu", "holiday", "Harvest", "Paper kites and a grain-sorting tray", "Physical, Creative"],
     [24, "Day of Education · National Girl Child Day", "fixed", "Gender equality", "'When I grow up' drawing wall", "Language, Socio-emotional"],
     [26, "Republic Day", "holiday", "Patriotism", "Tricolour hand-print flag, made together", "Cognitive, Physical"],
     [30, "Martyrs' Day", "fixed", "Peace", "Fold a paper dove, two minutes of quiet", "Socio-emotional, Fine motor"]],
    [[2, "Basant Panchami", "variable", "Knowledge", "Yellow colour hunt and first letters", "Pre-writing, Colour recognition"],
     [4, "World Cancer Day", "fixed", "Health", "Healthy-plate sorting game", "Cognitive, Physical"],
     [21, "Mother Language Day", "fixed", "Many languages", "Say 'hello' in every home language in the room", "Language, Social"],
     [22, "Science Week", "week", "Inquiry", "Float or sink? One small experiment a day", "Scientific thinking"],
     [26, "Maha-Shivratri", "variable", "Balance", "Rhythm clapping and stillness game", "Rhythm, Self-control"],
     [28, "National Science Day", "fixed", "Curiosity", "Shadow play with a torch", "Cognitive, Inquiry"]],
    [[8, "International Women's Day", "fixed", "Empowerment", "Thank-you cards for women at home", "Creative, Socio-emotional"],
     [14, "Holi", "variable", "Joy & colour", "Flower-petal colours, mixing primaries", "Sensory, Colour"],
     [22, "World Water Day", "fixed", "Saving water", "'Nal band karo' tap-off mime and chant", "Cognitive, Eco-literacy"],
     [30, "Gudi Padwa · Ugadi", "variable", "Renewal", "Taste six flavours, sweet to bitter", "Cultural awareness"],
     [31, "Eid-ul-Fitr", "variable", "Sharing food", "Moon-phase walk and a sweet-box to share", "Social-emotional, Fine motor"]],
    [[6, "Ram Navami", "variable", "Journeys", "Puppet path retelling", "Cognitive, Values"],
     [7, "World Health Day", "fixed", "Hygiene", "Handwashing song, six steps", "Physical, Health"],
     [10, "Mahavir Jayanti", "variable", "Kindness to animals", "Care for a plant sapling or toy pet", "Emotional, Value for life"],
     [13, "Vaisakhi", "holiday", "Harvest", "Harvest dance, grinding-wheat role play", "Gross motor, Culture"],
     [14, "Ambedkar Jayanti", "holiday", "Equality", "Everyone gets a turn: a fair-share game", "Moral, Creative"],
     [16, "Earth Week", "week", "Nature", "A daily green-task chart", "Environmental sensitivity"],
     [18, "Good Friday", "variable", "Kindness", "Puppet story of sacrifice and care", "Emotional processing"],
     [22, "Earth Day", "fixed", "Ecology", "Natural vs made-by-us sorting", "Eco-consciousness"]],
    [[1, "Labour Day", "fixed", "Professions", "Dress up as the helpers around us", "Cognitive, Social"],
     [7, "Rabindranath Tagore Jayanti", "fixed", "Poetry", "Read a Tagore poem, decorate it with lines", "Language, Aesthetic"],
     [11, "Mother's Day", "weekday", "Gratitude", "Art as a gift for mothers", "Emotional, Language"],
     [12, "Buddha Purnima", "variable", "Calm", "Silent circle time, breathing with a bell", "Self-regulation"],
     [31, "World No Tobacco Day", "fixed", "Health", "Clean-air poster with hand prints", "Physical, Awareness"]],
    [[5, "World Environment Day", "fixed", "Nature", "Seed planting in old cups", "Eco-literacy, Creative"],
     [7, "Bakrid", "variable", "Sharing", "Paper sheep and a story about giving", "Socio-emotional, Creative"],
     [15, "Father's Day", "weekday", "Family", "'My father's job' story circle", "Language, Emotional"],
     [21, "International Day of Yoga", "fixed", "Mindfulness", "Animal yoga poses", "Physical, Self-regulation"],
     [27, "Rath Yatra", "variable", "Community", "Toy chariot parade with a pull-along cart", "Gross motor, Retelling"]],
    [[6, "Muharram", "variable", "Peace & reflection", "Quiet candle circle", "Emotional awareness"],
     [11, "World Population Day", "fixed", "Counting us", "Count the class, boys, girls, everyone", "Math, Social"],
     [26, "Kargil Vijay Diwas", "fixed", "Courage", "Thank-you cards for soldiers", "Socio-emotional, Creative"]],
    [[3, "Friendship Day", "weekday", "Friendship", "Make a friendship band for a classmate", "Fine motor, Emotional"],
     [9, "Raksha Bandhan", "variable", "Siblings", "Rakhi threading with big beads", "Fine motor, Social"],
     [15, "Independence Day · Parsi New Year", "holiday", "Freedom", "Kite colours and a sun drawing", "Physical, Creative"],
     [16, "Janmashtami", "variable", "Stories", "Butter-pot (matki) balance game", "Gross motor, Story"],
     [27, "Ganesh Chaturthi", "variable", "Problem solving", "Clay modelling with small hands", "Fine motor, Cognitive"],
     [29, "National Sports Day", "fixed", "Play", "Relay races and cheering", "Gross motor, Social"]],
    [[1, "Hindi Pakhwada", "week", "Mother tongue fortnight", "One Hindi rhyme a day, building to the alphabet tree", "Language, Cognitive"],
     [5, "Onam · Teachers' Day", "variable", "Abundance & gratitude", "Onam flower circle (pookalam) and a thank-you card", "Aesthetic, Fine motor"],
     [7, "Grandparents' Day", "weekday", "Family", "Ask a grandparent: 'what did you play?'", "Intergenerational bonding"],
     [8, "International Literacy Day", "fixed", "Reading", "My first storybook, 3 to 4 pages", "Early literacy"],
     [14, "Hindi Diwas", "fixed", "Mother tongue", "Hindi alphabet tree", "Language, Confidence"]],
    [[2, "Gandhi Jayanti · Dussehra", "holiday", "Non-violence, good over evil", "Clean-up drive and a charkha spin", "Moral, Fine motor"],
     [11, "International Day of the Girl Child", "fixed", "Empowerment", "'I can' strength cards", "Cognitive, Aspirational"],
     [16, "World Food Day", "fixed", "Nutrition", "Rainbow plate from local vegetables", "Health, Eco-awareness"],
     [20, "Diwali", "variable", "Light over darkness", "Decorate a clay diya", "Fine motor, Creative"],
     [22, "Govardhan Puja", "variable", "Caring for nature", "Mountain of leaves, counting cows", "Eco-awareness, Math"],
     [23, "Bhai Dooj", "variable", "Sibling bonds", "Tilak cards for brothers and sisters", "Socio-emotional, Creative"],
     [27, "Chhath Puja", "variable", "Sun energy", "Sunrise and sunset shadow drawing", "Science, Socio-emotional"],
     [31, "National Unity Day", "fixed", "Unity", "One big class collage", "Social, Creative"]],
    [[5, "Guru Nanak Jayanti", "variable", "Service", "Langar play: serve each other", "Socio-emotional, Moral"],
     [14, "Children's Day", "holiday", "Child rights", "Children choose the day's games", "Socio-emotional, Moral"],
     [20, "Constitution Week", "week", "Rights", "Make our class rules together", "Socio-emotional, Language"],
     [26, "Constitution Day", "fixed", "Democracy", "Vote for the story of the day", "Civic awareness"]],
    [[10, "Human Rights Day", "fixed", "Equality", "Everyone's hand on one big tree", "Moral, Cognitive"],
     [18, "Maths Week", "week", "Patterns", "Bead patterns and shape hunts", "Math, Fine motor"],
     [22, "National Mathematics Day", "fixed", "Numbers", "Ramanujan number play", "Logical, Spatial"],
     [25, "Christmas", "holiday", "Joy", "Christmas joy jar of kind deeds", "Creative, Emotional"]]
  ];

  var SEASONS = ["Winter", "Winter", "Spring", "Spring", "Summer", "Summer", "Monsoon", "Monsoon", "Monsoon", "Autumn", "Autumn", "Winter"];
  var WEATHER = ["Sunny", "Cloudy", "Rainy", "Windy"];
  var MOODS = ["Happy", "Calm", "Sad", "Cross"];
  var MOON_NAMES = ["New moon", "Waxing crescent", "First quarter", "Waxing gibbous", "Full moon", "Waning gibbous", "Last quarter", "Waning crescent"];

  var ICON = {
    Sunny: '<circle cx="24" cy="24" r="8"/><path d="M24 6v6M24 36v6M6 24h6M36 24h6M11 11l4 4M33 33l4 4M37 11l-4 4M15 33l-4 4" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    Cloudy: '<path d="M14 34a8 8 0 0 1 1-16 11 11 0 0 1 21 3 6.5 6.5 0 0 1-1 13z"/>',
    Rainy: '<path d="M14 28a8 8 0 0 1 1-16 11 11 0 0 1 21 3 6.5 6.5 0 0 1-1 13z"/><path d="M17 33l-2 6M25 33l-2 6M33 33l-2 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    Windy: '<path d="M6 18h22a5 5 0 1 0-5-5M6 26h30a5 5 0 1 1-5 5M6 34h14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    Winter: '<path d="M24 6v36M8 15l32 18M8 33l32-18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    Spring: '<circle cx="24" cy="24" r="5"/><circle cx="24" cy="13" r="6"/><circle cx="24" cy="35" r="6"/><circle cx="13" cy="24" r="6"/><circle cx="35" cy="24" r="6"/>',
    Summer: '<circle cx="24" cy="24" r="10"/><path d="M24 4v6M24 38v6M4 24h6M38 24h6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    Monsoon: '<path d="M24 6c8 10 12 16 12 22a12 12 0 0 1-24 0c0-6 4-12 12-22z"/>',
    Autumn: '<path d="M24 42V22M24 22c-12 0-16-10-14-16 8 0 14 4 14 16zm0 0c10 0 14-8 12-13-7 0-12 3-12 13z"/>',
    Happy: '<circle cx="17" cy="19" r="3"/><circle cx="31" cy="19" r="3"/><path d="M14 28c5 7 15 7 20 0" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    Calm: '<path d="M13 20h7M28 20h7M16 30h16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    Sad: '<circle cx="17" cy="19" r="3"/><circle cx="31" cy="19" r="3"/><path d="M15 34c5-6 13-6 18 0" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    Cross: '<path d="M12 15l8 4M36 15l-8 4M15 33c5-4 13-4 18 0" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="17" cy="22" r="2.5"/><circle cx="31" cy="22" r="2.5"/>'
  };
  function svg(inner) { return '<svg viewBox="0 0 48 48" aria-hidden="true" fill="currentColor">' + inner + "</svg>"; }

  // moon phase (0 = new, .5 = full) from a known new moon, 6 Jan 2000 18:14 UTC
  function moonPhase(m, n) {
    var t = Date.UTC(YEAR, m, n, 12) - Date.UTC(2000, 0, 6, 18, 14);
    var p = (t / 86400000) / 29.530588853 % 1;
    return p < 0 ? p + 1 : p;
  }
  function moonSvg(p) {
    var r = 17, cx = 24, cy = 24, k = Math.cos(2 * Math.PI * p), rx = Math.abs(k) * r;
    var d = p < .5
      ? "M24 7A17 17 0 0 1 24 41A" + rx + " 17 0 0 " + (k > 0 ? 0 : 1) + " 24 7z"
      : "M24 7A17 17 0 0 0 24 41A" + rx + " 17 0 0 " + (k > 0 ? 1 : 0) + " 24 7z";
    return '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" class="moon__dark"/><path d="' + d + '" class="moon__lit"/></svg>';
  }

  var board = document.querySelector("[data-board]");
  if (!board) return;
  var grid = board.querySelector(".pb__grid");
  var layer = board.querySelector(".pb__blocks");
  var moEl = board.querySelector(".pb__mo");
  var dial = function (k) { return board.querySelector('[data-dial="' + k + '"]'); };
  var chips = document.querySelector("[data-months]");
  var panel = document.querySelector("[data-panel]");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  for (var i = 0; i < 42; i++) grid.appendChild(el("span", "pb__peg"));
  var blocks = [];
  for (var n = 1; n <= 31; n++) {
    var b = el("button", "pb__blk"); b.type = "button"; b.dataset.n = n;
    b.style.setProperty("--i", n);
    b.appendChild(el("span", "pb__num", n));
    layer.appendChild(b); blocks.push(b);
  }
  MONTHS.forEach(function (m, i) {
    var c = el("button", "pb__chip", m); c.type = "button"; c.dataset.m = i;
    c.setAttribute("aria-label", MONTH_NAMES[i]);
    chips.appendChild(c);
  });

  var now = new Date();
  var state = { m: now.getMonth(), n: now.getDate(), weather: 0, mood: 0 };

  function daysIn(m) { return new Date(YEAR, m + 1, 0).getDate(); }
  function weekday(m, n) { return (new Date(YEAR, m, n).getDay() + 6) % 7; }
  function eventsOn(m, n) { return E[m].filter(function (e) { return e[0] === n; }); }
  function weekOn(m, n) {
    return E[m].filter(function (e) { var end = WEEK_END[(m + 1) + "-" + e[0]]; return e[2] === "week" && n > e[0] && n <= end; })[0];
  }
  function catOn(m, n) { var ev = eventsOn(m, n); if (ev.length) return ev[0][2]; return weekOn(m, n) ? "week" : ""; }

  function renderMonth() {
    var m = state.m, max = daysIn(m), off = weekday(m, 1);
    chips.querySelectorAll(".pb__chip").forEach(function (c, i) { c.setAttribute("aria-pressed", i === m ? "true" : "false"); });
    var letters = MONTHS[m].split("");
    moEl.querySelectorAll(".pb__letter").forEach(function (s, i) { s.textContent = letters[i]; });
    blocks.forEach(function (b, i) {
      var n = i + 1, cell = off + i, cat = catOn(m, n);
      b.hidden = n > max;
      b.style.left = (cell % 7) * (100 / 7) + "%";
      b.style.top = Math.floor(cell / 7) * (100 / 6) + "%";
      b.className = "pb__blk" + (cat ? " pb__blk--" + cat : "");
      var ev = eventsOn(m, n);
      b.classList.toggle("has-leaf", ev.some(function (e) { return e[2] === "holiday"; }));
      b.setAttribute("aria-label", n + " " + MONTH_NAMES[m] + (ev.length ? ": " + ev.map(function (e) { return e[1]; }).join(", ") : ""));
    });
    var season = SEASONS[m];
    dial("season").innerHTML = svg(ICON[season]) + "<b>" + season + "</b>";
    if (state.n > max) state.n = max;
    if (!reduce) { layer.classList.remove("is-hanging"); void layer.offsetWidth; layer.classList.add("is-hanging"); }
  }

  function row(dl, k, v) { var w = el("div"); w.appendChild(el("dt", null, k)); w.appendChild(el("dd", null, v)); dl.appendChild(w); }

  function renderDay() {
    var m = state.m, n = state.n, wd = weekday(m, n);
    blocks.forEach(function (b, i) { b.setAttribute("aria-pressed", i + 1 === n ? "true" : "false"); });
    board.querySelectorAll(".pb__wd").forEach(function (w, i) { w.classList.toggle("is-on", i === wd); });

    var p = moonPhase(m, n), idx = Math.round(p * 8) % 8;
    dial("moon").innerHTML = moonSvg(p) + "<b>" + MOON_NAMES[idx] + "</b>";
    dial("weather").innerHTML = svg(ICON[WEATHER[state.weather]]) + "<b>" + WEATHER[state.weather] + "</b>";
    dial("mood").innerHTML = '<span class="pb__face">' + svg(ICON[MOODS[state.mood]]) + "</span><b>" + MOODS[state.mood] + "</b>";

    panel.querySelector("[data-date]").textContent = DAY_NAMES[wd] + ", " + n + " " + MONTH_NAMES[m] + " " + YEAR;
    var list = panel.querySelector("[data-events]");
    list.innerHTML = "";
    var ev = eventsOn(m, n), wk = weekOn(m, n);
    if (wk) ev = ev.concat([wk]);
    if (ev.length) {
      ev.forEach(function (e) {
        var li = el("li", "sbp__ev");
        li.appendChild(el("span", "sbp__tag sbp__tag--" + e[2], CATS[e[2]]));
        li.appendChild(el("h3", "sbp__name", e[1]));
        var dl = el("dl", "sbp__meta");
        row(dl, "Theme", e[3]); row(dl, "Activity", e[4]); row(dl, "Builds", e[5]);
        if (e[2] === "holiday") row(dl, "Note", "The centre is closed today, so this activity runs on the day before (the leaf mark on the block).");
        li.appendChild(dl);
        list.appendChild(li);
      });
    } else {
      var li = el("li", "sbp__ev sbp__ev--quiet");
      li.appendChild(el("span", "sbp__tag sbp__tag--body", "Know your body"));
      li.appendChild(el("h3", "sbp__name", BODY[m][0]));
      var dl = el("dl", "sbp__meta");
      row(dl, "Activity", BODY[m][1]);
      row(dl, "Why", "No festival today, so the booklet falls back to this month's body theme.");
      li.appendChild(dl);
      list.appendChild(li);
    }
    var next = n < daysIn(m) ? eventsOn(m, n + 1).filter(function (e) { return e[2] === "holiday"; })[0] : null;
    var prep = panel.querySelector("[data-prep]");
    prep.hidden = !next;
    if (next) prep.querySelector("span").textContent = "The centre is closed tomorrow for " + next[1] + ", so celebrate today: " + next[4].toLowerCase() + ".";

    var up = null;
    for (var k = 0; k < 12 && !up; k++) {
      var mm = (m + k) % 12;
      E[mm].some(function (e) { if (k > 0 || e[0] > n) { up = [mm, e]; return true; } return false; });
    }
    var nx = panel.querySelector("[data-next]");
    nx.textContent = up ? up[1][1] + ", " + up[1][0] + " " + MONTH_NAMES[up[0]] : "";
    nx.dataset.jump = up ? up[0] + "-" + up[1][0] : "";
  }

  function set(m, n) { var changed = m !== state.m; state.m = m; state.n = n; if (changed) renderMonth(); renderDay(); }

  chips.addEventListener("click", function (e) {
    var c = e.target.closest(".pb__chip"); if (!c) return;
    var m = +c.dataset.m; set(m, Math.min(state.n, daysIn(m)));
  });
  layer.addEventListener("click", function (e) {
    var b = e.target.closest(".pb__blk"); if (!b) return;
    set(state.m, +b.dataset.n);
  });
  dial("weather").addEventListener("click", function () { state.weather = (state.weather + 1) % WEATHER.length; renderDay(); });
  dial("mood").addEventListener("click", function () { state.mood = (state.mood + 1) % MOODS.length; renderDay(); });
  document.querySelectorAll("[data-step]").forEach(function (b) {
    b.addEventListener("click", function () {
      var d = new Date(YEAR, state.m, state.n + (+b.dataset.step));
      set(d.getMonth(), d.getDate());
    });
  });
  document.addEventListener("click", function (e) {
    var j = e.target.closest("[data-jump]"); if (!j || !j.dataset.jump) return;
    var p = j.dataset.jump.split("-"); set(+p[0], +p[1]);
    if (!j.closest("[data-panel]")) board.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  });

  state.m = -1; set(now.getMonth(), now.getDate());
})();
