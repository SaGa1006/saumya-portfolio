# Ship turn frames

`ship.html` builds the hero ship as a small three.js model (hull, castle, portholes, mast, yards, sail)
with a painterly shader in Saumya's colours. `render.js` renders it at given angles in headless Chromium,
and `woodtex.py` paints the dry-brush wood texture (`woodtex.png`) the hull is wrapped in, and `paintfx.py` softens each render into brush-like patches (Kuwahara filter).

    npm i three@0.160.0 playwright && cp node_modules/three/build/three.module.js .
    python3 -m http.server 8766 &
    node render.js "[0, 4.74, ..., 90]" r5 && python3 paintfx.py r5 900

The 20 frames are then packed 5x4 into `assets/hero/ship-turn.webp`, and the mast/deck points from
`r5/meta.json` go into the `TURN` table in `js/hero.js`.
