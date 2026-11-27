/*
 * Living sea for the hero.
 *
 * The painted sea layer (assets/hero/sea.webp, a seamless 1912 px tile) is drawn with WebGL
 * and pushed around by a few overlapping swells, so the brush strokes roll instead of sliding.
 * Swells grow taller toward the viewer, crests catch a little light, troughs darken, foam
 * shimmers and a slow teal/blue wash drifts across, all from Saumya's own colours.
 *
 * Two canvases draw the same water: the back one behind the ship, the front one above it,
 * masked below a moving waterline, so the hull sits *in* the sea rather than on top of it.
 * The ship reads the same swell function to ride the waves (heave and pitch).
 *
 * Coordinates are the 1920 x 1080 artboard. Falls back to the still painting without WebGL;
 * draws one still frame for prefers-reduced-motion; stops when the hero is off screen.
 */
(function () {
  var scene = document.querySelector(".scene");
  if (!scene) return;
  var back = scene.querySelector(".sea-gl--back");
  var front = scene.querySelector(".sea-gl--front");
  var ship = scene.querySelector(".ship");
  var bob = scene.querySelector(".ship__bob");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var SEA_TOP = 754, SEA_H = 306, TILE_W = 1912;

  // Rows of waves, back to front: where the painted crest sits, how fast the row rolls toward
  // the stern (px/s) and how tall its swell is. Far rows are slow and low, near rows fast and tall.
  var BANDS = [
    { top: 754, speed: 22, amp: 4,  off: 0 },
    { top: 800, speed: 36, amp: 6,  off: 611 },
    { top: 852, speed: 54, amp: 8,  off: 233 },
    { top: 908, speed: 78, amp: 10, off: 947 },   // in front of the hull
    { top: 978, speed: 104, amp: 13, off: 412 }
  ];
  var FRONT_FROM = 3;

  // vertical swell of one row at x (positive = raised); the shader uses the same formula
  function swell(i, x, t) {
    var b = BANDS[i], w = 0.9 + i * 0.18;
    return b.amp * (Math.sin(x * 0.0045 + t * w + i * 1.7) + 0.4 * Math.sin(x * 0.011 - t * w * 1.3 + i));
  }

  var VERT = "attribute vec2 p; varying vec2 vUv; void main(){ vUv = vec2(p.x*.5+.5, .5-p.y*.5); gl_Position = vec4(p,0.,1.); }";
  function frag(first, last) {
    var body = [];
    for (var i = first; i <= last; i++) {
      var b = BANDS[i], d = (i / (BANDS.length - 1)).toFixed(3);
      body.push(
        "  {",
        "    float w = " + (0.9 + i * 0.18).toFixed(3) + ";",
        "    float sw = " + b.amp.toFixed(1) + "*(sin(x*.0045 + t*w + " + (i * 1.7).toFixed(2) + ") + .4*sin(x*.011 - t*w*1.3 + " + i + ".0));",
        "    float drop = uDrop*" + (18 + 50 * (i / (BANDS.length - 1))).toFixed(1) + ";",   // scrolling lowers near rows more: parallax
        "    float row = y - (" + b.top.toFixed(1) + " - sw + drop);",
        "    float crest = " + b.top.toFixed(1) + " - sw + drop + 28.0;",
        // a soft shadow cast by this row's crest onto the water behind it
        "    acc.rgb *= 1.0 - .28*smoothstep(crest - 26.0, crest + 4.0, y);",
        "    if (row >= 0.0) {",
        "      float sx = x - t*" + b.speed.toFixed(1) + " + " + b.off.toFixed(1) + ";",
        "      vec4 c = texture2D(uTex, vec2(fract(sx/TW), min(row, SH - 1.0)/SH));",
        "      if (c.a > .002) {",
        "        vec3 col = c.rgb/c.a;",
        "        col = mix(col, col*.6 + vec3(.20,.44,.47)*.4, .22*(1.0 - " + d + "));",   // far rows: lighter, greener
        "        col = mix(col, col*.6 + vec3(.04,.15,.34)*.4, .18*" + d + ");",            // near rows: deeper blue
        "        float lum = dot(col, vec3(.3,.59,.11));",
        "        col += smoothstep(.45, .75, lum)*.10*(.5 + .5*sin(t*2.6 + x*.05 + y*.09 + " + i + ".0));",
        "        acc = vec4(clamp(col, 0.0, 1.0)*c.a, c.a) + acc*(1.0 - c.a);",
        "      }",
        "    }",
        "  }");
    }
    return [
      "precision highp float;",
      "varying vec2 vUv;",
      "uniform sampler2D uTex; uniform float uT, uY0, uH, uDrop;",
      "const float TW = " + TILE_W + ".0, SH = " + SEA_H + ".0;",
      "void main(){",
      "  float x = vUv.x*1920.0, y = uY0 + vUv.y*uH, t = uT;",
      "  vec4 acc = vec4(0.0);"
    ].concat(body, ["  gl_FragColor = acc;", "}"]).join("\n");
  }

  function makeLayer(canvas, y0, h, fragSrc) {
    var gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return null;
    function sh(type, src) {
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    }
    var prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fragSrc));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1f(gl.getUniformLocation(prog, "uY0"), y0);
    gl.uniform1f(gl.getUniformLocation(prog, "uH"), h);
    return { gl: gl, canvas: canvas, uT: gl.getUniformLocation(prog, "uT"), uDrop: gl.getUniformLocation(prog, "uDrop"), ready: false };
  }

  function upload(layer, img) {
    var gl = layer.gl, tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    layer.ready = true;
  }

  var layers;
  try {
    layers = [makeLayer(back, 700, 380, frag(0, FRONT_FROM - 1)), makeLayer(front, 880, 200, frag(FRONT_FROM, BANDS.length - 1))];
    if (!layers[0] || !layers[1]) return;
  } catch (e) {
    return; // keep the still painting
  }
  layers.forEach(function (l) { l.hero = true; });

  // The same moving sea again at the top of the beach (section 4), all five rows in one canvas,
  // with the sand painted over it. It never drops with the voyage scroll.
  var shore = document.querySelector(".shore");
  var shoreCanvas = shore && shore.querySelector(".shore-sea");
  if (shoreCanvas) {
    try {
      var sl = makeLayer(shoreCanvas, 700, 380, frag(0, BANDS.length - 1));
      if (sl) { sl.hero = false; layers.push(sl); }
    } catch (e) { /* the beach keeps its still sea */ }
  }

  var scale = 1;
  function resize() {
    var w = scene.clientWidth;
    scale = w / 1920;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    layers.forEach(function (l) {
      var cw = Math.max(1, Math.round(l.canvas.clientWidth * dpr));
      var ch = Math.max(1, Math.round(l.canvas.clientHeight * dpr));
      if (l.canvas.width !== cw || l.canvas.height !== ch) {
        l.canvas.width = cw; l.canvas.height = ch;
        l.gl.viewport(0, 0, cw, ch);
      }
    });
  }

  function draw(t, all) {
    layers.forEach(function (l) {
      if (!all && !(l.hero ? heroVisible : shoreVisible)) return;
      var gl = l.gl;
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(l.uT, t);
      gl.uniform1f(l.uDrop, l.hero ? ((window.SagaVoyage && window.SagaVoyage.exit) || 0) : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    });
  }

  // the ship rides the row of waves at its hull: heave from the average, pitch from bow vs stern
  var heave = 0, pitch = 0;
  function rideShip(t) {
    var sceneLeft = scene.getBoundingClientRect().left;
    var shipLeft = (ship.getBoundingClientRect().left - sceneLeft) / scale; // artboard px, follows the entry
    var xb = shipLeft + 150, xs = shipLeft + 800;                         // bow and stern at the waterline
    var hb = (swell(2, xb, t) + swell(3, xb, t)) / 2, hs = (swell(2, xs, t) + swell(3, xs, t)) / 2;
    var targetHeave = -(hb + hs) / 2;
    var targetPitch = Math.atan2(hb - hs, xs - xb) * 0.9;
    heave += (targetHeave - heave) * 0.1;    // a little inertia: the hull lags the water slightly
    pitch += (targetPitch - pitch) * 0.1;
    bob.style.transform = "translate3d(0," + (heave * scale).toFixed(2) + "px,0) rotate(" + pitch.toFixed(4) + "rad)";
  }

  // the flag as cloth: columns of the painted flag ride a wave that travels from the mast to
  // the tip, growing toward the free end, with light and shade on the folds
  var flagImg = scene.querySelector(".ship__flag"), cloth = null, PAD = 0.14;
  function setupCloth() {
    if (cloth || !flagImg || !flagImg.naturalWidth) return;
    var c = document.createElement("canvas");
    c.className = "ship__cloth"; c.setAttribute("aria-hidden", "true");
    c.width = flagImg.naturalWidth;
    c.height = Math.round(flagImg.naturalHeight * (1 + 2 * PAD));
    flagImg.parentNode.insertBefore(c, flagImg.nextSibling);
    cloth = c.getContext("2d");
    scene.classList.add("has-cloth");
  }
  function drawCloth(t) {
    if (!cloth) return;
    var w = flagImg.naturalWidth, h = flagImg.naturalHeight, pad = h * PAD, H = cloth.canvas.height, STEP = 2;
    cloth.globalCompositeOperation = "source-over";
    cloth.clearRect(0, 0, w, H);
    var slopes = [];
    for (var x = 0; x < w; x += STEP) {
      var u = x / w, amp = h * 0.10 * Math.pow(u, 1.15) + 0.5;
      var p1 = x * 0.038 - t * 5.2, p2 = x * 0.083 - t * 8.3 + 1.2;
      var dy = amp * (Math.sin(p1) + 0.35 * Math.sin(p2));
      slopes.push(amp * (0.038 * Math.cos(p1) + 0.35 * 0.083 * Math.cos(p2)));
      cloth.drawImage(flagImg, x, 0, STEP, h, x, pad + dy, STEP, h);
    }
    cloth.globalCompositeOperation = "source-atop";   // fold shading only where the flag is
    for (var i = 0; i < slopes.length; i++) {
      var k = slopes[i];
      cloth.fillStyle = k > 0 ? "rgba(10,14,30," + Math.min(0.3, k * 0.22).toFixed(3) + ")"
                              : "rgba(220,230,245," + Math.min(0.18, -k * 0.14).toFixed(3) + ")";
      cloth.fillRect(i * STEP, 0, STEP, H);
    }
  }

  var running = false, visible = true, heroVisible = true, shoreVisible = false, start = performance.now(), raf = 0;
  function frame(now) {
    raf = 0;
    if (!running) return;
    var t = (now - start) / 1000;
    draw(t);
    if (heroVisible) { rideShip(t); drawCloth(t); }
    raf = requestAnimationFrame(frame);
  }
  function play() { if (!running && visible && !reduce) { running = true; raf = requestAnimationFrame(frame); } }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

  var img = new Image();
  img.onload = function () {
    layers.forEach(function (l) { upload(l, img); });
    scene.classList.add("has-gl"); // show the canvases first so they have a size
    if (layers.length > 2) shore.classList.add("has-gl");
    resize();
    draw(0, true);
    if (!reduce) { if (flagImg.complete) setupCloth(); else flagImg.addEventListener("load", setupCloth); }
    play();
  };
  img.src = "assets/hero/sea.webp";

  window.addEventListener("resize", function () { resize(); if (!running) draw(0, true); });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.target === scene) heroVisible = e.isIntersecting; else shoreVisible = e.isIntersecting;
      });
      visible = heroVisible || shoreVisible;
      if (visible) play(); else stop();
    }).observe(scene);
    if (layers.length > 2) { shoreVisible = false; new IntersectionObserver(function (entries) {
      shoreVisible = entries[0].isIntersecting;
      visible = heroVisible || shoreVisible;
      if (visible) play(); else stop();
    }).observe(shoreCanvas); }
  } else { shoreVisible = true; }
  document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else play(); });
})();
