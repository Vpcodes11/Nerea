import fs from 'node:fs/promises';
import sharp from '../artifacts/tools/node_modules/sharp/dist/index.cjs';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';
import {FloatType} from 'three';
const tone=x=>Math.max(0,Math.min(1,(x*(2.51*x+.03))/(x*(2.43*x+.59)+.14)));
const srgb=x=>x<=.0031308?x*12.92:1.055*Math.pow(x,1/2.4)-.055;
for(const name of ['night','dusk']){
 const source=await fs.readFile(`artifacts/${name}-sky-4k.hdr`);
 const hdr=new HDRLoader().setDataType(FloatType).parse(source.buffer.slice(source.byteOffset,source.byteOffset+source.byteLength));
 const pixels=Buffer.alloc(hdr.width*hdr.height*3);
 for(let i=0;i<hdr.width*hdr.height;i++)for(let c=0;c<3;c++)pixels[i*3+c]=Math.round(255*srgb(tone(hdr.data[i*4+c]*(name==='night'?.45:.32))));
 await sharp(pixels,{raw:{width:hdr.width,height:hdr.height,channels:3}}).webp({quality:91}).toFile(`public/textures/${name}-sky.webp`);
 console.log(name,hdr.width,hdr.height);
}
