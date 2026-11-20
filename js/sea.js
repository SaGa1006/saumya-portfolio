/*
 * Living sea for the hero.
 *
 * The painted sea layer (assets/hero/sea.webp, a seamless 1527 px tile) is drawn with WebGL
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

  var SEA_TOP = 754, SEA_H = 326, TILE_W = 1527, WATERLINE = 948;

  // Same swell as the shader (keep in sync). Positive = water surface raised.
  function wave(x, d, t) {
    var a = 5 + 11 * d;
    return a * (0.55 * Math.sin(x * 0.0052 - t * 0.85 + d * 2.3) +
                0.30 * Math.sin(x * 0.0115 + t * 0.60 + d * 5.1 + 1.7) +
                0.15 * Math.sin(x * 0.0240 - t * 1.55 + d * 9.0 + 0.4));
  }

  var VERT = "attribute vec2 p; varying vec2 vUv; void main(){ vUv = vec2(p.x*.5+.5, .5-p.y*.5); gl_Position = vec4(p,0.,1.); }";
  var FRAG = [
    "precision highp float;",
    "varying vec2 vUv;",
    "uniform sampler2D uTex; uniform float uT, uY0, uH, uFront;",
    "const float TW = " + TILE_W + ".0, ST = " + SEA_TOP + ".0, SH = " + SEA_H + ".0;",
    "float wave(float x, float d, float t){",
    "  float a = 5.0 + 11.0*d;",
    "  return a*( .55*sin(x*.0052 - t*.85 + d*2.3)",
    "           + .30*sin(x*.0115 + t*.60 + d*5.1 + 1.7)",
    "           + .15*sin(x*.0240 - t*1.55 + d*9.0 + .4) );",
    "}",
    "void main(){",
    "  float x = vUv.x*1920.0, y = uY0 + vUv.y*uH, t = uT;",
    "  float d = clamp((y - ST)/SH, 0.0, 1.0);",
    "  float h = wave(x, d, t);",
    // sideways sway, strongest near the viewer, plus a slow current toward the stern
    "  float sx = x + (3.0 + 7.0*d)*sin(x*.0037 + t*.45 + d*3.0) + 2.0*sin(y*.045 - t*1.1) - t*14.0;",
    "  float sy = y - ST + h;",
    "  if (sy < 0.0) { gl_FragColor = vec4(0.0); return; }",
    "  vec4 c = texture2D(uTex, vec2(fract(sx/TW), min(sy, SH - 1.0)/SH));",
    "  if (c.a < .002) { gl_FragColor = vec4(0.0); return; }",
    "  vec3 col = c.rgb/c.a;",
    // light: crests a touch brighter, the side facing away a touch darker
    "  float slope = (wave(x + 4.0, d, t) - wave(x - 4.0, d, t))/8.0;",
    "  float lift = clamp(h/(5.0 + 11.0*d), -1.0, 1.0);",
    "  col *= 1.0 + .07*lift + .20*slope;",
    // slow drifting wash between Saumya's teal and deep blue
    "  float n = sin(x*.0021 + t*.21 + y*.006)*sin(x*.0013 - t*.17 + 1.3);",
    "  vec3 tint = mix(vec3(.05,.33,.36), vec3(.08,.24,.46), .5 + .5*n);",
    "  col = mix(col, col*.55 + tint*.45, .16*(.5 + .5*n)*(.35 + .65*d));",
    // foam shimmer on the light strokes
    "  float lum = dot(col, vec3(.3,.59,.11));",
    "  float foam = smoothstep(.45, .75, lum);",
    "  col += foam*.09*(.5 + .5*sin(t*2.2 + x*.06 + y*.11 + sin(x*.013 + t)));",
    "  float a = c.a;",
    "  if (uFront > .5) {",
    "    float wl = " + WATERLINE + ".0 - wave(x, " + ((WATERLINE - SEA_TOP) / SEA_H).toFixed(4) + ", t)",
    "             + 3.0*sin(x*.09 + t*1.3)*sin(x*.031 - t*.7);",
    "    a *= smoothstep(wl - 4.0, wl + 8.0, y);",
    "  }",
    "  gl_FragColor = vec4(clamp(col, 0.0, 1.0)*a, a);",
    "}"
  ].join("\n");

  function makeLayer(canvas, y0, h, isFront) {
    var gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return null;
    function sh(type, src) {
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    }
    var prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
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
    gl.uniform1f(gl.getUniformLocation(prog, "uFront"), isFront ? 1 : 0);
    return { gl: gl, canvas: canvas, uT: gl.getUniformLocation(prog, "uT"), ready: false };
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
    layers = [makeLayer(back, 700, 380, false), makeLayer(front, 880, 200, true)];
    if (!layers[0] || !layers[1]) return;
  } catch (e) {
    return; // keep the still painting
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

  function draw(t) {
    layers.forEach(function (l) {
      var gl = l.gl;
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(l.uT, t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    });
  }

  // the ship rides the same swell: heave from the average height, pitch from bow vs stern
  var dW = (WATERLINE - SEA_TOP) / SEA_H, heave = 0, pitch = 0;
  function rideShip(t) {
    var sceneLeft = scene.getBoundingClientRect().left;
    var shipLeft = (ship.getBoundingClientRect().left - sceneLeft) / scale; // artboard px, follows the entry
    var xb = shipLeft + 150, xs = shipLeft + 800;                         // bow and stern at the waterline
    var hb = wave(xb, dW, t), hs = wave(xs, dW, t);
    var targetHeave = -(hb + hs) / 2;
    var targetPitch = Math.atan2(hb - hs, xs - xb) * 0.85;
    heave += (targetHeave - heave) * 0.12;   // a little inertia: the hull lags the water slightly
    pitch += (targetPitch - pitch) * 0.12;
    bob.style.transform = "translate3d(0," + (heave * scale).toFixed(2) + "px,0) rotate(" + pitch.toFixed(4) + "rad)";
  }

  var running = false, visible = true, start = performance.now(), raf = 0;
  function frame(now) {
    raf = 0;
    if (!running) return;
    var t = (now - start) / 1000;
    draw(t);
    rideShip(t);
    raf = requestAnimationFrame(frame);
  }
  function play() { if (!running && visible && !reduce) { running = true; raf = requestAnimationFrame(frame); } }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

  var img = new Image();
  img.onload = function () {
    layers.forEach(function (l) { upload(l, img); });
    scene.classList.add("has-gl"); // show the canvases first so they have a size
    resize();
    draw(0);
    play();
  };
  img.src = "assets/hero/sea.webp";

  window.addEventListener("resize", function () { resize(); if (!running) draw(0); });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) play(); else stop();
    }).observe(scene);
  }
  document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else play(); });
})();
