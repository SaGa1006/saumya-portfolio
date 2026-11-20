# Kuwahara filter: flattens the render into soft brush-like patches, keeps alpha
import sys, glob, numpy as np
from PIL import Image
from scipy.ndimage import uniform_filter, shift
def kuwahara(rgb, r):
    k=r+1; lum=rgb@np.array([.299,.587,.114])
    m=np.stack([uniform_filter(rgb[...,i],k) for i in range(3)],-1); m2=uniform_filter(lum*lum,k); ml=uniform_filter(lum,k); var=m2-ml*ml
    best=None; bv=None; o=r/2
    for dy,dx in [(-o,-o),(-o,o),(o,-o),(o,o)]:
        mv=shift(var,(dy,dx),order=0,mode='nearest'); mm=np.stack([shift(m[...,i],(dy,dx),order=0,mode='nearest') for i in range(3)],-1)
        if best is None: best,bv=mm,mv
        else: sel=mv<bv; best[sel]=mm[sel]; bv=np.minimum(bv,mv)
    return best
def fx(src,dst,size):
    im=np.asarray(Image.open(src).convert('RGBA')).astype(np.float32)/255
    a=im[...,3:]; rgb=im[...,:3]
    # bleed colour into transparent pixels so edges do not pick up black
    pre=np.stack([uniform_filter(rgb[...,i]*a[...,0],5) for i in range(3)],-1); aw=uniform_filter(a[...,0],5)[...,None]
    rgb=np.where(a>0.01,rgb,pre/np.maximum(aw,1e-4))
    out=kuwahara(rgb,6)
    res=np.concatenate([np.clip(out,0,1),a],-1)
    Image.fromarray((res*255).astype(np.uint8)).resize((size,size),Image.LANCZOS).save(dst)
if __name__=='__main__':
    d=sys.argv[1]; size=int(sys.argv[2])
    for f in sorted(glob.glob(d+'/f*.png')): fx(f, f.replace('/f','/p'), size)
