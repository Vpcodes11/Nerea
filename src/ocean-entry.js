import './ocean-entry.css';

export function createOceanEntry(onEnter) {
  const dialog=document.createElement('dialog');dialog.className='ocean-entry';
  dialog.setAttribute('aria-labelledby','entry-title');
  dialog.innerHTML=`<div class="entry-landscape" aria-hidden="true"><div class="entry-sky"></div><div class="entry-glow"></div><div class="entry-cloud entry-cloud-left"></div><div class="entry-cloud entry-cloud-right"></div><div class="entry-cloud entry-cloud-high"></div><canvas class="entry-water"></canvas><div class="entry-horizon"></div><div class="entry-sea-light"></div><div class="entry-grain"></div></div>
    <div class="entry-top"><span class="entry-brand">NERÉA<sup>®</sup></span><span>A LITTLE OCEAN. A DAILY RITUAL.</span></div>
    <div class="entry-copy"><span class="entry-kicker">A MOMENT BEFORE THE WORLD BEGINS</span><h1 id="entry-title">Between sea<br>&amp; <em>sky.</em></h1><p>Watch the horizon breathe. The ocean is opening.</p></div>
    <div class="entry-bottom"><div class="entry-actions"><button class="entry-enter" disabled>Gathering the tides <span>↗</span></button><button class="entry-silent" disabled>Continue without sound</button><span class="entry-sound-note">ORIGINAL AMBIENT SCORE · BEST WITH HEADPHONES</span></div><div class="entry-progress"><span class="entry-status" role="status">Opening the horizon</span><span class="entry-number" aria-hidden="true">00<small>/ 100</small></span><div class="entry-track" role="progressbar" aria-label="Ocean loading progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div></div></div>`;
  document.body.append(dialog);const previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal();
  let disposed=false,ready=false,frame=0,lastDraw=0,progress=0;
  const canvas=dialog.querySelector('canvas'),ctx=canvas.getContext('2d'),sky=new Image();sky.src='/textures/night-sky.webp';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function draw(time=0){
    if(disposed)return;
    if(time-lastDraw>55||!lastDraw){
      lastDraw=time;const w=Math.min(Math.round(innerWidth*.7),720),h=Math.min(Math.round(innerHeight*.34),300);
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
      if(ctx){
        const base=ctx.createLinearGradient(0,0,0,h);base.addColorStop(0,'#768490');base.addColorStop(.2,'#465f70');base.addColorStop(1,'#152c3e');ctx.fillStyle=base;ctx.fillRect(0,0,w,h);
        const t=reduced.matches?0:time*.0009;
        if(sky.complete&&sky.naturalWidth){ctx.globalAlpha=.38;for(let y=0;y<h;y+=4){const depth=y/h,shift=Math.sin(y*.12+t*4)*depth*18+Math.sin(y*.035-t*2)*22*depth;ctx.drawImage(sky,0,sky.naturalHeight*(.62-depth*.42),sky.naturalWidth,6,shift-24,y,w+48,4);}ctx.globalAlpha=1;}
        for(let i=0;i<68;i++){const d=i/68,y=Math.pow(d,1.65)*h,spread=22+d*w*.3,phase=t*2.2+i*1.7,center=w*.53+Math.sin(phase)*d*32;ctx.strokeStyle=`rgba(231,228,214,${(.035+(1-d)*.15)*(.72+.28*Math.sin(phase*.7))})`;ctx.lineWidth=.6+d*1.5;ctx.beginPath();ctx.moveTo(center-spread*(.25+.7*Math.sin(i*17+t*.3)**2),y);ctx.quadraticCurveTo(center,y+Math.sin(phase)*3*d,center+spread*(.25+.7*Math.cos(i*13-t*.25)**2),y+Math.sin(phase+1)*2*d);ctx.stroke();}
      }
    }
    if(!reduced.matches&&!document.hidden)frame=requestAnimationFrame(draw);
  }
  const resume=()=>{cancelAnimationFrame(frame);draw();};document.addEventListener('visibilitychange',resume);reduced.addEventListener('change',resume);window.addEventListener('resize',resume);sky.onload=resume;draw();
  function update(value,label){if(disposed||ready)return;progress=Math.max(progress,Math.min(99,Math.round(value)));dialog.querySelector('.entry-number').innerHTML=`${String(progress).padStart(2,'0')}<small>/ 100</small>`;dialog.querySelector('.entry-track').setAttribute('aria-valuenow',progress);dialog.querySelector('.entry-track i').style.transform=`scaleX(${progress/100})`;if(label)dialog.querySelector('.entry-status').textContent=label;}
  function complete(fallback=false){if(disposed)return;if(ready){if(!fallback)dialog.querySelector('.entry-status').textContent='Your ocean is ready';return;}update(99);ready=true;dialog.dataset.ready='true';dialog.querySelector('.entry-number').innerHTML='100<small>/ 100</small>';dialog.querySelector('.entry-track').setAttribute('aria-valuenow','100');dialog.querySelector('.entry-track i').style.transform='scaleX(1)';dialog.querySelector('.entry-status').textContent=fallback?'A quieter ocean is ready':'Your ocean is ready';dialog.querySelector('.entry-enter').innerHTML='Enter with sound <span>↗</span>';dialog.querySelectorAll('button').forEach(b=>b.disabled=false);dialog.querySelector('.entry-enter').focus({preventScroll:true});}
  function destroy(){if(disposed)return;disposed=true;cancelAnimationFrame(frame);sky.onload=null;document.removeEventListener('visibilitychange',resume);reduced.removeEventListener('change',resume);window.removeEventListener('resize',resume);dialog.close();dialog.remove();document.body.style.overflow=previousOverflow;}
  function enter(sound){if(!ready||disposed)return;onEnter(sound);dialog.classList.add('entry-leaving');dialog.querySelectorAll('button').forEach(b=>b.disabled=true);setTimeout(()=>{destroy();document.querySelector('.hero h1')?.setAttribute('tabindex','-1');document.querySelector('.hero h1')?.focus({preventScroll:true});},reduced.matches?0:1100);}
  dialog.querySelector('.entry-enter').onclick=()=>enter(true);dialog.querySelector('.entry-silent').onclick=()=>enter(false);dialog.addEventListener('cancel',e=>{e.preventDefault();if(ready)enter(false);});
  return {update,complete,destroy};
}
