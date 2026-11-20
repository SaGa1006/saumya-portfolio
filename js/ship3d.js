/*
 * The hero ship and SaGa as a live 3D scene (three.js), drawn in the illustration's palette:
 * painted wood texture, soft two-tone light, darker brushed edges and brown ink outlines.
 * It sails in with the hero, and on scroll the boat turns bow-on while she lowers the
 * telescope and steps up at the bow. The page drives it through window.SagaShip3D.turn(p).
 * Rebuild notes: tools/ship-turn/README.md
 */
import * as THREE from "../assets/vendor/three.module.min.js";

const canvasEl = document.querySelector(".ship__3d");
const sceneEl = document.querySelector(".scene");
const heroEl = document.querySelector(".hero");
const glintEl = document.querySelector(".ship__glint");
let gl = null;
try { gl = canvasEl && canvasEl.getContext("webgl2", { alpha: true, antialias: true, premultipliedAlpha: true }); } catch (e) { gl = null; }
if (canvasEl && gl) start();

function start() {
THREE.ColorManagement.enabled = false;
const renderer = new THREE.WebGLRenderer({ canvas: canvasEl, context: gl, alpha: true, antialias: true });
renderer.outputColorSpace = THREE.LinearSRGBColorSpace; renderer.setClearColor(0x000000, 0);
const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(18, 1, 1, 200);
const DIST = 52;
const L = new THREE.Vector3(-0.55, 0.75, 0.6).normalize();
const uTime = { value: 0 };

/* painterly material: toon light + brush-stroke noise + darker edges */
const NOISE = `
float h(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float n3(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*n3(p);p*=2.03;a*=.5;}return s;}`;
const woodTex = new THREE.TextureLoader().load('assets/hero/wood.webp', () => { if (typeof redraw === 'function') redraw(); });
woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping;
function woodMat(tint, dark, opt={}){
  return new THREE.ShaderMaterial({ side: opt.side ?? THREE.FrontSide,
    uniforms:{ uT:{value:woodTex}, uTint:{value:new THREE.Color(tint)}, uD:{value:new THREE.Color(dark)}, uLight:{value:L}, uS:{value:opt.scale||0.16}, uInner:{value:opt.inner?1:0} },
    vertexShader:`varying vec3 vN,vO,vV,vWN; void main(){ vO=position; vN=normal; vec4 w=modelMatrix*vec4(position,1.); vWN=normalize(mat3(modelMatrix)*normal);
      vV=normalize(cameraPosition-w.xyz); gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader:`uniform sampler2D uT; uniform vec3 uTint,uD,uLight; uniform float uS,uInner; varying vec3 vN,vO,vV,vWN;
      void main(){ vec3 n=normalize(vN), wn=normalize(vWN); if(!gl_FrontFacing){ n=-n; wn=-wn; }
        vec3 b=pow(abs(n),vec3(4.)); b/=b.x+b.y+b.z;
        vec3 t=texture2D(uT,vec2(vO.x,vO.y)*uS*vec2(1.,2.)).rgb*b.z + texture2D(uT,vec2(vO.z,vO.y)*uS*vec2(1.,2.)).rgb*b.x + texture2D(uT,vec2(vO.x,vO.z)*uS).rgb*b.y;
        float l=dot(wn,uLight); float tone=smoothstep(-.3,.2,l)*.5+smoothstep(.3,.65,l)*.5;
        vec3 c=t*uTint*mix(.62,1.08,tone);
        float rim=1.-abs(dot(wn,normalize(vV)));
        c=mix(c,uD,pow(rim,2.2)*.6);                          // dark dry-brushed edges, like the painting
        if(uInner>.5 && !gl_FrontFacing) c*=.7;
        gl_FragColor=vec4(c,1.); }` });
}
function paint(base, dark, light, opt={}){
  return new THREE.ShaderMaterial({
    side: opt.side ?? THREE.FrontSide,
    uniforms:{ uB:{value:new THREE.Color(base)}, uD:{value:new THREE.Color(dark)}, uL:{value:new THREE.Color(light)},
      uLight:{value:L}, uGrain:{value:new THREE.Vector3(...(opt.grain||[1,6,6]))}, uBlot:{value:new THREE.Color(opt.blot||dark)}, uBlotAmt:{value:opt.blotAmt||0}, uInner:{value:opt.inner?1:0} },
    vertexShader:`varying vec3 vN; varying vec3 vP; varying vec3 vO; varying vec3 vV;
      void main(){ vO=position; vec4 w=modelMatrix*vec4(position,1.); vP=w.xyz; vN=normalize(mat3(modelMatrix)*normal);
      vV=normalize(cameraPosition-w.xyz); gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader:`uniform vec3 uB,uD,uL,uLight,uGrain,uBlot; uniform float uBlotAmt,uInner; varying vec3 vN,vP,vO,vV;`+NOISE+`
      void main(){ vec3 n=normalize(vN); if(!gl_FrontFacing) n=-n;
        float l=dot(n,uLight);
        float t=smoothstep(-.25,.15,l)*.55+smoothstep(.35,.6,l)*.45;      // two soft painted tones
        float g=fbm(vO*uGrain);                                          // brush grain along the wood
        float g2=fbm(vO*uGrain*2.7+7.);
        vec3 c=mix(uD,uB,t);
        c=mix(c,uL,smoothstep(.55,.8,g)*.45*t);
        c=mix(c,uD,smoothstep(.5,.75,g2)*.35);
        float b=fbm(vO*.9+3.); c=mix(c,uBlot,smoothstep(.55,.72,b)*uBlotAmt);
        float rim=1.-abs(dot(n,normalize(vV)));
        c=mix(c,uD*.8,pow(rim,2.5)*.55);                               // darker brushed edges like the painting
        if(uInner>.5 && !gl_FrontFacing) c*=.72;
        gl_FragColor=vec4(c,1.); }`
  });
}
const WOOD = woodMat('#ffffff','#5e3a1c',{side:THREE.DoubleSide,inner:true});
const WOOD2 = woodMat('#e8dccb','#55341a',{scale:.3});
const POLE = woodMat('#ece0cf','#55341a',{scale:.5});
const SAIL = paint('#d3d4a6','#a7ad84','#e6e4bf',{grain:[1.5,1.5,1.5],side:THREE.DoubleSide,blot:'#8f9d78',blotAmt:.55});
const GLASS = new THREE.MeshBasicMaterial({color:'#2b4a63'});
const GLASSD = new THREE.MeshBasicMaterial({color:'#17283a'});
const INK = new THREE.MeshBasicMaterial({color:'#4a2c15', side:THREE.BackSide});
const SHADOW = new THREE.MeshBasicMaterial({color:'#3b2410'});

const ship = new THREE.Group(); scene.add(ship);
const outlined = [];
function add(mesh, ink=0.045){ ship.add(mesh); if(ink) outlined.push([mesh,ink]); return mesh; }

/* ---- hull: lofted sections, bow at -x ---- */
const X0=-4.7, X1=4.1;
const sm=(a,b,x)=>{x=Math.min(1,Math.max(0,(x-a)/(b-a)));return x*x*(3-2*x);};
const W = u => 3.05*Math.pow(Math.sin(Math.min(1,u/0.7)*Math.PI/2),0.95) - 0.22*sm(.8,1,u);
const YB = u => -2.1 + 1.9*Math.pow(Math.max(0,1-u/0.32),2) + 0.35*sm(.8,1,u);
const YT = u => 1.0 + 0.55*Math.pow(Math.max(0,1-u/0.4),1.6) + 0.55*sm(.55,.85,u);
function hullGeo(){
  const NU=80, NV=40, pos=[], idx=[];
  for(let i=0;i<=NU;i++){ const u=i/NU, x=X0+(X1-X0)*u, w=Math.max(.02,W(u)), yt=YT(u), yb=YB(u);
    for(let j=0;j<=NV;j++){ const v=j/NV, a=v*Math.PI, s=Math.cos(a), d=Math.sin(a);
      const z = w*Math.sign(s)*Math.pow(Math.abs(s),0.32);
      const y = yt-(yt-yb)*Math.pow(d,2.8);
      pos.push(x,y,z); } }
  for(let i=0;i<NU;i++)for(let j=0;j<NV;j++){const a=i*(NV+1)+j,b=a+NV+1; idx.push(a,b,a+1,b,b+1,a+1);}
  // transom cap
  const c0=pos.length/3; pos.push(X1,(YT(1)+YB(1))/2,0);
  for(let j=0;j<NV;j++){ idx.push(c0, NU*(NV+1)+j, NU*(NV+1)+j+1); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const hull = add(new THREE.Mesh(hullGeo(), WOOD), 0.05);
// deck
{ const s=new THREE.Shape(); const N=40;
  for(let i=0;i<=N;i++){const u=.05+.95*i/N; s[i?'lineTo':'moveTo'](X0+(X1-X0)*u, W(u)*.93);}
  for(let i=N;i>=0;i--){const u=.05+.95*i/N; s.lineTo(X0+(X1-X0)*u,-W(u)*.93);}
  const d=new THREE.Mesh(new THREE.ShapeGeometry(s), woodMat('#cdb497','#5a391c',{side:THREE.DoubleSide}));
  d.rotation.x=-Math.PI/2; d.position.y=0.55; ship.add(d); }
// a dark band (wale) along the hull
{ const pts=[]; for(let i=0;i<=60;i++){const u=.06+.94*i/60; pts.push(new THREE.Vector3(X0+(X1-X0)*u, 0.55+0.12*Math.pow(Math.max(0,1-u/0.4),1.6), 0));}
  for (const side of [1,-1]) { const p2=pts.map((p,i)=>{const u=.06+.94*i/60; const yt=YT(u),yb=YB(u); const d=Math.pow((yt-p.y)/(yt-yb),1/2.8); const a=Math.asin(Math.min(1,d)); const s=Math.cos(a);
      return new THREE.Vector3(p.x,p.y,side*(Math.max(.02,W(u))*Math.pow(s,0.32)+0.06));});
    add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p2),80,0.11,8), WOOD2),0.03); } }
// rail cap along the top edge
for (const side of [1,-1]) { const p=[]; for(let i=0;i<=60;i++){const u=.02+.98*i/60; p.push(new THREE.Vector3(X0+(X1-X0)*u, YT(u)+.05, side*Math.max(.02,W(u))));}
  add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p),90,0.09,8), WOOD2),0.03); }

/* ---- stern castle with arched windows ---- */
const castle = new THREE.Group(); ship.add(castle);
{ const len=2.1, x=X1-len/2-0.05, w=W(0.88)*2*.98, h=1.55, y0=YT(.88)-0.05;
  const box = new THREE.Mesh(new THREE.BoxGeometry(len,h,w), WOOD2); box.position.set(x,y0+h/2,0); castle.add(box); outlined.push([box,.05]);
  const top = new THREE.Mesh(new THREE.BoxGeometry(len+0.7,0.32,w+0.3), WOOD); top.position.set(x+0.2,y0+h+0.12,0); castle.add(top); outlined.push([top,.04]);
  const arch = new THREE.Shape(); arch.moveTo(-.22,-.45); arch.lineTo(-.22,.18); arch.absarc(0,.18,.22,Math.PI,0,true); arch.lineTo(.22,-.45); arch.lineTo(-.22,-.45);
  for (const side of [1,-1]) for (const dx of [-.3,.32]) { const m=new THREE.Mesh(new THREE.ShapeGeometry(arch), SHADOW);
    m.position.set(x+dx, y0+h*.55, side*(w/2+0.01)); if(side<0) m.rotation.y=Math.PI; castle.add(m); }
  for (const dz of [-.45,0,.45]) { const m=new THREE.Mesh(new THREE.ShapeGeometry(arch), SHADOW); m.scale.setScalar(.8);
    m.position.set(x+len/2+0.01, y0+h*.55, dz); m.rotation.y=Math.PI/2; castle.add(m); }
}
/* ---- portholes ---- */
for (const side of [1,-1]) for (const px of [-0.6,0.9,2.35]) {
  const u=(px-X0)/(X1-X0), yt=YT(u), yb=YB(u), y=-0.15, d=Math.pow((yt-y)/(yt-yb),1/2.8), s=Math.cos(Math.asin(Math.min(1,d)));
  const z=side*(W(u)*Math.pow(s,0.32));
  const g=new THREE.Group(); g.position.set(px,y,z+side*0.04);
  const nrm=new THREE.Vector3(0,0.15,side).normalize(); g.lookAt(g.position.clone().add(nrm));
  const ring=new THREE.Mesh(new THREE.TorusGeometry(0.36,0.11,10,28), WOOD2); g.add(ring);
  const glass=new THREE.Mesh(new THREE.CircleGeometry(0.33,28), GLASS); g.add(glass);
  const bar=new THREE.Mesh(new THREE.PlaneGeometry(0.05,0.62), GLASSD); bar.position.z=.01; g.add(bar);
  const bar2=bar.clone(); bar2.rotation.z=Math.PI/2; g.add(bar2);
  ship.add(g); outlined.push([ring,.03]);
}
/* ---- stern scroll ---- */
for (const side of [1,-1]) { const t=new THREE.Mesh(new THREE.TorusGeometry(0.32,0.1,8,24,Math.PI*1.6), WOOD2);
  t.position.set(X1+0.15, 0.55, side*1.9); add(t,.03); }

/* ---- bowsprit, mast, yards, sail ---- */
function pole(a,b,r){ const v=new THREE.Vector3().subVectors(b,a), m=new THREE.Mesh(new THREE.CylinderGeometry(r*.85,r,v.length(),10), POLE);
  m.position.copy(a).addScaledVector(v,.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), v.clone().normalize()); return add(m,.03); }
pole(new THREE.Vector3(X0+0.6,1.75,0), new THREE.Vector3(X0-2.6,2.75,0), .13);
const MX=0.2;
pole(new THREE.Vector3(MX,0.5,0), new THREE.Vector3(MX,10.2,0), .15);
const BR = 52*Math.PI/180;              // yards braced round so the sail shows from the side and the front
const rig = new THREE.Group(); rig.position.x=MX; rig.rotation.y=BR; ship.add(rig);
function yard(y,len){ const m=new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,len,10),POLE); m.rotation.x=Math.PI/2; m.position.set(-0.45,y,0); rig.add(m); outlined.push([m,.03]);
  for(const e of [-1,1]){const k=new THREE.Mesh(new THREE.TorusGeometry(.13,.05,6,14),POLE); k.position.set(-0.45,y,e*len/2); k.rotation.y=Math.PI/2; rig.add(k);} }
yard(8.4,4.6); yard(3.5,5.6);
function sailGeo(yTop,yBot,wTop,wBot,belly,curveFoot){
  const NU=24,NV=24,pos=[],idx=[];
  for(let i=0;i<=NV;i++){const v=i/NV, y=yTop+(yBot-yTop)*v, w=wTop+(wBot-wTop)*v;
    for(let j=0;j<=NU;j++){const u=j/NU, z=(u-.5)*w, bul=belly*Math.sin(Math.PI*u)*Math.sin(Math.PI*(0.15+0.85*v));
      pos.push(bul + 0.25*Math.sin(v*3)*0, y + (i===NV?curveFoot*Math.sin(Math.PI*u):0) + 0.25*(u-.5)*v, z);} }
  for(let i=0;i<NV;i++)for(let j=0;j<NU;j++){const a=i*(NU+1)+j,b=a+NU+1;idx.push(a,b,a+1,b,b+1,a+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g;}
{ const s1=new THREE.Mesh(sailGeo(8.3,3.55,4.4,5.4,-1.4,0),SAIL); s1.position.x=-0.5; rig.add(s1); outlined.push([s1,.035]); }


/* ---- SaGa ----
   character space: feet at the origin, facing -x (the bow), +z toward the viewer in the hero */
const SKIN = paint('#e2a985','#b97556','#f0c3a2',{grain:[2,2,2]});
const SHIRT = new THREE.ShaderMaterial({
  uniforms:{ uLight:{value:L} },
  vertexShader:`varying vec3 vO,vWN,vV; void main(){ vO=position; vec4 w=modelMatrix*vec4(position,1.); vWN=normalize(mat3(modelMatrix)*normal);
    vV=normalize(cameraPosition-w.xyz); gl_Position=projectionMatrix*viewMatrix*w; }`,
  fragmentShader:`uniform vec3 uLight; varying vec3 vO,vWN,vV;
    void main(){ vec3 n=normalize(vWN); float l=dot(n,uLight); float t=smoothstep(-.25,.15,l)*.55+smoothstep(.35,.6,l)*.45;
      float s=step(.5,fract(vO.y*4.2));                     // red and white stripes
      vec3 c=mix(vec3(.93,.9,.84),vec3(.66,.24,.2),s); c*=mix(.66,1.05,t);
      float rim=1.-abs(dot(n,normalize(vV))); c=mix(c,c*.6,pow(rim,2.4)*.6);
      gl_FragColor=vec4(c,1.); }` });
const PANTS = paint('#a4935f','#6e6239','#c0b07a',{grain:[3,3,3]});
const BOOT = paint('#4d2f1b','#2b190d','#6b4428',{grain:[3,3,3]});
const HAT = paint('#47301d','#25170c','#6a4a2e',{grain:[3,3,3]});
const BELT = paint('#6b4427','#3b2412','#8a5c36',{grain:[3,3,3]});
const BRASS = paint('#c39a4e','#7d5a22','#efd38a',{grain:[2,2,8]});
const INKD = new THREE.MeshBasicMaterial({ color:'#2a170c' });
const BLUSH = new THREE.MeshBasicMaterial({ color:'#e48c7c', transparent:true, opacity:.55 });

const char = new THREE.Group(); ship.add(char);
const charParts = [];
function part(geo, mat, ink=.03){ const m=new THREE.Mesh(geo,mat); char.add(m); if(ink) outlined.push([m,ink]); return m; }
// limb segments: capsules along +y, placed between two points every frame
const Y = new THREE.Vector3(0,1,0);
function seg(r, len, mat){ const m=part(new THREE.CapsuleGeometry(r, len, 6, 12), mat); m.userData.len=len; return m; }
function place(m, a, b){ const v=new THREE.Vector3().subVectors(b,a); m.position.copy(a).addScaledVector(v,.5);
  m.quaternion.setFromUnitVectors(Y, v.normalize()); }
// two-bone reach: shoulder/hip a, target t, lengths l1 l2, pole = which way the elbow/knee points
function reach(a, t, l1, l2, pole){
  const d=new THREE.Vector3().subVectors(t,a); let len=d.length(); const max=(l1+l2)*.995;
  if (len>max){ d.setLength(max); t=a.clone().add(d); len=max; }
  const x=(l1*l1-l2*l2+len*len)/(2*len), h=Math.sqrt(Math.max(0,l1*l1-x*x));
  const dir=d.clone().normalize(), side=pole.clone().addScaledVector(dir,-pole.dot(dir)).normalize();
  return [a.clone().addScaledVector(dir,x).addScaledVector(side,h), t]; }

const torso = part(new THREE.CapsuleGeometry(.46, .62, 8, 16), SHIRT, .035); torso.scale.set(.86,1,1);
const belt = part(new THREE.CylinderGeometry(.49,.49,.14,20), BELT, .02); belt.scale.set(.86,1,1);
const hipsM = part(new THREE.SphereGeometry(.47,16,12), PANTS, .03); hipsM.scale.set(.86,.7,1);
const head = new THREE.Group(); char.add(head);
{ const s=new THREE.Mesh(new THREE.SphereGeometry(.62,24,18), SKIN); head.add(s); outlined.push([s,.035]);
  for (const z of [.2,-.2]) { const e=new THREE.Mesh(new THREE.SphereGeometry(.075,10,8), INKD); e.scale.set(.6,1.25,1); e.position.set(-.57,.02,z); head.add(e);
    const b=new THREE.Mesh(new THREE.CircleGeometry(.11,14), BLUSH); b.position.set(-.53,-.16,z*1.35); b.lookAt(b.position.clone().add(new THREE.Vector3(-1,0,z*1.5))); head.add(b); }
  const nose=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6), SKIN); nose.position.set(-.62,-.06,0); head.add(nose);
  const mouth=new THREE.Mesh(new THREE.TorusGeometry(.07,.016,6,12,Math.PI), INKD); mouth.position.set(-.585,-.24,0); mouth.rotation.set(0,-Math.PI/2,Math.PI); head.add(mouth);
  // hat: wide brim with the sides turned up, a domed crown and a band
  const brimG=new THREE.CylinderGeometry(1.0,1.0,.07,32,1); const bp=brimG.attributes.position;
  for (let i=0;i<bp.count;i++){ const x=bp.getX(i), z=bp.getZ(i), r=Math.hypot(x,z); bp.setY(i, bp.getY(i)+Math.max(0,r-.55)*.75*Math.abs(z)/Math.max(r,.01)); }
  brimG.computeVertexNormals();
  const brim=new THREE.Mesh(brimG,HAT); brim.position.y=.38; brim.rotation.z=-.12; head.add(brim); outlined.push([brim,.03]);
  const crown=new THREE.Mesh(new THREE.SphereGeometry(.56,20,12,0,Math.PI*2,0,Math.PI/2),HAT); crown.position.y=.4; crown.scale.set(1,.72,1); crown.rotation.z=-.12; head.add(crown); outlined.push([crown,.03]);
  const band=new THREE.Mesh(new THREE.CylinderGeometry(.565,.565,.1,24,1,true), BELT); band.position.y=.45; band.rotation.z=-.12; head.add(band);
  // hair: a dark mass at the back and long wavy strands that stream in the wind
  const hairMat=new THREE.ShaderMaterial({ side:THREE.DoubleSide, uniforms:{ uTime, uLight:{value:L}, uWind:{value:1} },
    vertexShader:`uniform float uTime,uWind; attribute float aPh; varying vec3 vWN,vV; varying float vA;
      void main(){ vec3 p=position; float a=uv.x; vA=a; float k=a*a;
        // wind from the bow: strands stream back (+x) and lift, with waves running down each one
        p.x+=k*(.55+.18*sin(uTime*3.1+a*5.+aPh))*uWind; p.y+=k*(.25+.12*sin(uTime*2.3+aPh*1.7))*uWind;
        p.z+=k*.22*sin(uTime*4.+a*7.+aPh*2.)*uWind;
        vec4 w=modelMatrix*vec4(p,1.); vWN=normalize(mat3(modelMatrix)*normal); vV=normalize(cameraPosition-w.xyz); gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader:`uniform vec3 uLight; varying vec3 vWN,vV; varying float vA;
      void main(){ vec3 n=normalize(vWN); if(!gl_FrontFacing) n=-n; float l=dot(n,uLight); float t=smoothstep(-.2,.3,l);
        vec3 c=mix(vec3(.11,.06,.035),vec3(.29,.17,.1),t); c=mix(c,vec3(.36,.22,.13),smoothstep(.55,.8,l)*.5);
        gl_FragColor=vec4(c,1.); }` });
  const mass=new THREE.Mesh(new THREE.SphereGeometry(.66,20,14), hairMat.clone()); mass.material.uniforms.uWind.value=0;
  mass.position.set(.1,.04,0); mass.scale.set(.95,1.02,1.06); head.add(mass); outlined.push([mass,.03]);
  for (let i=0;i<17;i++){
    const ang = (-115 + i*230/16) * Math.PI/180;              // round the back and sides of the head, never the face
    const rx=Math.cos(ang), rz=Math.sin(ang);
    const root=new THREE.Vector3(.05+.5*rx, .18, .6*rz);
    const out=new THREE.Vector3(.35+.25*Math.random(), 0, rz*.6);
    const pts=[]; const len=1.5+.35*Math.random(), curl=.09+.05*Math.random(), ph=Math.random()*6;
    for (let s=0;s<=12;s++){ const f=s/12;
      pts.push(new THREE.Vector3(root.x+out.x*f*1.1+curl*Math.sin(f*11+ph), root.y-f*len, root.z+out.z*f+curl*Math.cos(f*11+ph))); }
    const g=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 36, .1-.02*Math.random(), 7);
    // taper toward the tip
    const gp=g.attributes.position, gu=g.attributes.uv, cen=new THREE.CatmullRomCurve3(pts);
    for (let v=0;v<gp.count;v++){ const a=gu.getX(v), c=cen.getPoint(a), tp=1-.75*a*a;
      gp.setXYZ(v, c.x+(gp.getX(v)-c.x)*tp, c.y+(gp.getY(v)-c.y)*tp, c.z+(gp.getZ(v)-c.z)*tp); }
    g.computeVertexNormals();
    g.setAttribute('aPh', new THREE.Float32BufferAttribute(new Array(gp.count).fill(ph),1));
    const m=new THREE.Mesh(g,hairMat); head.add(m); outlined.push([m,.022]);
  }
}
const armU=[seg(.15,.5,SHIRT),seg(.15,.5,SHIRT)], armL=[seg(.13,.45,SKIN),seg(.13,.45,SKIN)];
const hands=[part(new THREE.SphereGeometry(.16,12,10),SKIN,.02),part(new THREE.SphereGeometry(.16,12,10),SKIN,.02)];
const legU=[seg(.21,.42,PANTS),seg(.21,.42,PANTS)], legL=[seg(.17,.4,PANTS),seg(.17,.4,PANTS)];
const boots=[part(new THREE.CapsuleGeometry(.19,.3,6,12),BOOT,.03),part(new THREE.CapsuleGeometry(.19,.3,6,12),BOOT,.03)];
// telescope: three brass draw tubes that slide out when she zooms
const scope=new THREE.Group(); char.add(scope);
const tubes=[[.12,.62],[.1,.5],[.08,.42]].map(([r,l],i)=>{ const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,l,16), i?BRASS:BELT); m.userData.l=l; scope.add(m); outlined.push([m,.02]); return m; });
const lensRim=new THREE.Mesh(new THREE.TorusGeometry(.13,.035,8,18), BRASS); scope.add(lensRim);
const lensPoint=new THREE.Object3D(); scope.add(lensPoint);
// a little crate at the bow for her to step up on
const crate=new THREE.Mesh(new THREE.BoxGeometry(.7,.6,.8), WOOD2); ship.add(crate); outlined.push([crate,.03]);
crate.position.set(-3.75,.85,0);

const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const lerpV=(a,b,t)=>a.clone().lerp(b,t);
function pose(p, zoom, t){
  // where she stands: amidships with the telescope, then up at the bow
  char.position.set(-1.35 + (-2.2)*p, 0.55, 0);
  const sway=Math.sin(t*1.3)*.03;
  const hipY=1.08, chestY=2.0;
  // feet: a wide stance, then the front foot up on the crate
  const footF=lerpV(V(-.42,.0,.3), V(-1.62,.62,.18), p), footB=lerpV(V(.38,.0,-.26), V(.25,0,-.3), p);
  const hipF=V(-.05,hipY,.24), hipB=V(.05,hipY,-.24);
  const lean = .12 - .26*p;           // leans into the telescope, then stands tall and leans forward a touch
  const neck=V(-lean*.6+sway, chestY+.42, 0);
  const headC=V(neck.x-.05, neck.y+.55, 0);
  torso.position.set(-lean*.35, (hipY+chestY)/2+.12, 0); torso.rotation.set(0,0,-lean*.6);
  belt.position.set(-lean*.15, hipY+.18, 0); hipsM.position.set(0,hipY,0);
  head.position.copy(headC); head.rotation.set(0, 0, -.08 + .12*p - lean*.3);
  [[0,hipF,footF],[1,hipB,footB]].forEach(([i,h,f])=>{
    const [knee,foot]=reach(h, f.clone().add(V(0,.2,0)), .62, .58, V(-1,.2,0));
    place(legU[i], h, knee); place(legL[i], knee, foot);
    boots[i].position.copy(foot).add(V(-.12,-.06,0)); boots[i].rotation.set(0,0,Math.PI/2); });
  // telescope: at her eye pointing ahead, then lowered in her near hand
  const eye=headC.clone().add(V(-.55,.02,.2));
  const dirUp=V(-1,.06,0).normalize(), dirDown=V(-.32,-1,.12).normalize();
  const dir=dirUp.clone().lerp(dirDown,p).normalize();
  const handNearHold=lerpV(eye.clone().addScaledVector(dirUp,.32).add(V(0,-.1,.12)), V(-.35,1.25,.62), p);
  const eyepiece = p<1 ? lerpV(eye, handNearHold.clone().addScaledVector(dir,-.3), p) : handNearHold.clone().addScaledVector(dir,-.3);
  scope.position.copy(eyepiece); scope.quaternion.setFromUnitVectors(Y, dir);
  const ext=zoom*(1-p);
  let y=0; tubes.forEach((m,i)=>{ const l=m.userData.l, off=i===0?0:(i===1?.3+.3*ext:.62+.62*ext); m.position.set(0,off+l/2,0); y=off+l; });
  lensRim.position.set(0,y,0); lensRim.rotation.x=Math.PI/2; lensPoint.position.set(0,y+.02,0);
  const handFarHold=lerpV(eye.clone().addScaledVector(dirUp,.62+.25*ext).add(V(0,-.12,-.05)), V(.05,1.42,-.55), p);
  const sh=[V(-lean*.5,chestY,.42), V(-lean*.5,chestY,-.42)];
  const tg=[handNearHold, handFarHold];
  const poles=[lerpV(V(.2,-1,.6),V(.5,-.3,.6),p), lerpV(V(.2,-1,-.6),V(.4,-.2,-1),p)];
  [0,1].forEach(i=>{ const [el,h]=reach(sh[i], tg[i], .62, .58, poles[i]); place(armU[i], sh[i], el); place(armL[i], el, h); hands[i].position.copy(h); });
}
char.scale.setScalar(1.18);

/* ---- flag: the painted flag as cloth on the mast top ---- */
let flagMesh = null;
{
  const tex = new THREE.TextureLoader().load("assets/hero/flag.webp");
  const g = new THREE.PlaneGeometry(3.4, 1.22, 30, 6); g.translate(1.7, -.61, 0);
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ side: THREE.DoubleSide, transparent: true, uniforms: { uT:{value:tex}, uTime },
    vertexShader:`uniform float uTime; varying vec2 vUv; varying float vS;
      void main(){ vUv=uv; vec3 p=position; float a=uv.x;
        float w=sin(a*7.-uTime*7.)*.32*a + sin(a*13.-uTime*11.)*.07*a;
        p.z+=w; p.y+=sin(a*5.-uTime*5.)*.08*a - .25*a*a; vS=cos(a*7.-uTime*7.);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.); }`,
    fragmentShader:`uniform sampler2D uT; varying vec2 vUv; varying float vS;
      void main(){ vec4 c=texture2D(uT,vUv); if(c.a<.4) discard; c.rgb*=.86+.2*vS*vUv.x; gl_FragColor=vec4(c.rgb,1.); }` }));
  m.position.set(MX+.1, 10.15, 0); ship.add(m); flagMesh = m;
}

/* ---- ink outlines (inverted hulls) ---- */
for (const [m, w] of outlined) {
  const hairy = m.material && m.material.uniforms && m.material.uniforms.uWind;
  const mat = new THREE.ShaderMaterial({ side: THREE.BackSide, uniforms: hairy ? { uW:{value:w}, uTime, uWind:m.material.uniforms.uWind } : { uW:{value:w} },
    vertexShader: hairy
      ? `uniform float uW,uTime,uWind; attribute float aPh; void main(){ vec3 p=position; float a=uv.x, k=a*a;
          p.x+=k*(.55+.18*sin(uTime*3.1+a*5.+aPh))*uWind; p.y+=k*(.25+.12*sin(uTime*2.3+aPh*1.7))*uWind; p.z+=k*.22*sin(uTime*4.+a*7.+aPh*2.)*uWind;
          p+=normal*uW; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.); }`
      : `uniform float uW; void main(){ vec3 p=position+normal*uW; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.); }`,
    fragmentShader: `void main(){ gl_FragColor=vec4(.29,.17,.08,1.); }` });
  if (hairy && !m.geometry.attributes.aPh) m.geometry.setAttribute("aPh", new THREE.Float32BufferAttribute(new Array(m.geometry.attributes.position.count).fill(0), 1));
  m.add(new THREE.Mesh(m.geometry, mat));
}

/* ---- drive it ---- */
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let turnP = 0, shownP = -1, t0 = 0, running = false, raf = 0, sized = 0;
function size() {
  const r = canvasEl.getBoundingClientRect(), w = canvasEl.offsetWidth;
  const px = Math.min(1600, Math.round(w * Math.min(window.devicePixelRatio || 1, 1.5)));
  if (px && px !== sized) { sized = px; renderer.setSize(px, px, false); }
}
// zoom cycle matching the hero's 7s rhythm: out at 10-24%, held, back at 68-82%
function zoomAt(t) {
  if (t < 4) return 0; const c = ((t - 4) / 7) % 1, e = x => x * x * (3 - 2 * x);
  return c < .1 ? 0 : c < .24 ? e((c - .1) / .14) : c < .68 ? 1 : c < .82 ? 1 - e((c - .68) / .14) : 0;
}
const tmp = new THREE.Vector3();
function draw(now) {
  if (!t0 && heroEl.classList.contains("is-sailing")) t0 = now;
  const t = t0 ? (now - t0) / 1000 : 0;
  uTime.value = reduce ? 1.5 : now / 1000;
  const p = turnP, deg = 90 * p;
  const el = (9 + 7 * p) * Math.PI / 180;
  cam.position.set(0, Math.sin(el) * DIST + 3.2, Math.cos(el) * DIST); cam.lookAt(0, 3.2, 0);
  ship.rotation.y = deg * Math.PI / 180; rig.rotation.y = BR * (1 - p);
  if (flagMesh) flagMesh.rotation.y = p * 1.1;
  pose(p, reduce ? 0 : zoomAt(t), reduce ? 0 : t);
  renderer.render(scene, cam);
  // the star glint sits on the lens while she looks through it
  if (glintEl) {
    lensPoint.getWorldPosition(tmp); tmp.project(cam);
    glintEl.style.left = (-7.154 + (tmp.x + 1) / 2 * 134.128).toFixed(2) + "%";   // canvas box inside the ship box (see css)
    glintEl.style.top = (-20.712 + (1 - tmp.y) / 2 * 145.05).toFixed(2) + "%";
    glintEl.style.visibility = p > .05 ? "hidden" : "visible";
  }
  shownP = p;
}
function redraw() { if (!running) draw(performance.now()); }
function frame(now) { if (!running) return; draw(now); raf = requestAnimationFrame(frame); }
function play() { if (!running && !reduce && !sceneEl.classList.contains("is-paused") && !document.hidden) { running = true; raf = requestAnimationFrame(frame); } }
function stop() { running = false; cancelAnimationFrame(raf); }
new MutationObserver(() => { sceneEl.classList.contains("is-paused") ? stop() : play(); }).observe(sceneEl, { attributes: true, attributeFilter: ["class"] });
document.addEventListener("visibilitychange", () => { document.hidden ? stop() : play(); });
window.addEventListener("resize", () => { size(); if (!running) draw(performance.now()); });

window.SagaShip3D = { turn(p) { turnP = p; if (!running && Math.abs(p - shownP) > 1e-4) draw(performance.now()); } };
turnP = (window.SagaVoyage && window.SagaVoyage.exit) || 0;
sceneEl.classList.add("has-ship3d");
size();
if ("ResizeObserver" in window) new ResizeObserver(() => { size(); redraw(); }).observe(canvasEl);
setTimeout(() => { draw(performance.now()); play(); }, 0);
}
