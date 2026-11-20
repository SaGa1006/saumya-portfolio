const { chromium } = require('playwright'); const fs=require('fs'); const OUT=process.argv[3]||'out'; fs.mkdirSync(OUT,{recursive:true});
(async () => {
  const b = await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--allow-file-access-from-files']});
  const p = await b.newPage({viewport:{width:900,height:900}});
  p.on('pageerror',e=>console.log('err',e.message)); p.on('console',m=>console.log(m.text()));
  await p.goto('http://localhost:8766/ship.html'); await p.waitForFunction(()=>window.ready && window.texReady);
  const angles = JSON.parse(process.argv[2]||'[0,30,60,90]'); const meta=[];
  for (const a of angles) { const r = await p.evaluate(a=>window.renderAt(a), a);
    fs.writeFileSync(`${OUT}/f${String(a).padStart(3,'0')}.png`, Buffer.from(r.png.split(',')[1],'base64')); meta.push({a,tip:r.tip,deck:r.deck}); }
  fs.writeFileSync(OUT+'/meta.json', JSON.stringify(meta)); await b.close();
})();
