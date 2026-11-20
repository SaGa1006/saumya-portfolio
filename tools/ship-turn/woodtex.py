# hand-painted wood: soft base + many dry-brush strokes along the grain, tileable left-right
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
rng=np.random.default_rng(7); W,H=1024,512
def hexc(h): return tuple(int(h[i:i+2],16) for i in (1,3,5))
base=np.zeros((H,W,3),np.float32)+np.array(hexc('#ad8053'),np.float32)
# big soft tone patches, like a wide wet brush
lo=rng.random((5,9)); lo=np.asarray(Image.fromarray((lo*255).astype(np.uint8)).resize((W+W//8,H),Image.BICUBIC))[:, :W]/255.
lo=(lo+lo[:, ::-1])/2   # keep the left and right edges matching so it tiles
base*= (0.82+0.3*lo)[...,None]
img=Image.fromarray(np.clip(base,0,255).astype(np.uint8)).convert('RGBA')
pal=['#8a5c34','#7a4e2a','#c49a6b','#d4ab7c','#9b6c40','#6e4424','#b88c5e']
for n in range(900):
    layer=Image.new('RGBA',(W,H),(0,0,0,0)); d=ImageDraw.Draw(layer)
    c=hexc(pal[rng.integers(len(pal))]); a=int(rng.uniform(30,95))
    y=rng.uniform(0,H); x=rng.uniform(0,W); L=rng.uniform(80,420); w=rng.uniform(2,11); bend=rng.uniform(-14,14)
    pts=[(x+t*L, y+bend*np.sin(np.pi*t)+rng.normal(0,.6)) for t in np.linspace(0,1,24)]
    for dx in (-W,0,W):
        d.line([(p[0]+dx,p[1]) for p in pts], fill=c+(a,), width=int(w))
    arr=np.asarray(layer).astype(np.float32)
    # dry brush: break the stroke up with streaky noise along the grain
    nz=rng.random((H//2+1,W//16+1)); nz=np.asarray(Image.fromarray((nz*255).astype(np.uint8)).resize((W,H+2),Image.BILINEAR))[:H]/255.
    arr[...,3]*=np.clip((nz-.25)*2.2,0,1)
    img=Image.alpha_composite(img,Image.fromarray(arr.astype(np.uint8)))
img=img.convert('RGB')
g=rng.normal(0,7,(H,W,1)); out=np.clip(np.asarray(img).astype(np.float32)+g,0,255).astype(np.uint8)
Image.fromarray(out).filter(ImageFilter.GaussianBlur(.6)).save('woodtex.png')
