import './ocean-entry.css';

export function createOceanEntry(onEnter) {
  const dialog=document.createElement('dialog');dialog.className='ocean-entry';
  dialog.setAttribute('aria-labelledby','entry-title');
  dialog.innerHTML=`<div class="entry-landscape" aria-hidden="true"><video class="entry-ocean-film" autoplay muted loop playsinline preload="auto" poster="/textures/night-sky.webp"><source src="/ocean-entry.mp4" type="video/mp4"></video><div class="entry-film-grade"></div><div class="entry-grain"></div></div>
    <div class="entry-top"><span class="entry-brand">NERÉA<sup>®</sup></span><span>A LITTLE OCEAN. A DAILY RITUAL.</span></div>
    <div class="entry-copy"><span class="entry-kicker">A MOMENT BEFORE THE WORLD BEGINS</span><h1 id="entry-title">Between sea<br>&amp; <em>sky.</em></h1><p>Watch the horizon breathe. The ocean is opening.</p></div>
    <div class="entry-bottom"><div class="entry-actions"><button class="entry-enter" disabled>Gathering the tides <span>↗</span></button><button class="entry-silent" disabled>Continue without sound</button><span class="entry-sound-note">ORIGINAL AMBIENT SCORE · BEST WITH HEADPHONES</span></div><div class="entry-progress"><span class="entry-status" role="status">Opening the horizon</span><span class="entry-number" aria-hidden="true">00<small>/ 100</small></span><div class="entry-track" role="progressbar" aria-label="Ocean loading progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div></div></div>`;
  document.body.append(dialog);const previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal();
  let disposed=false,ready=false,progress=0;
  const film=dialog.querySelector('.entry-ocean-film');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const syncMotion=()=>{if(reduced.matches)film.pause();else film.play().catch(()=>{});};
  reduced.addEventListener('change',syncMotion);syncMotion();
  function update(value,label){if(disposed||ready)return;progress=Math.max(progress,Math.min(99,Math.round(value)));dialog.querySelector('.entry-number').innerHTML=`${String(progress).padStart(2,'0')}<small>/ 100</small>`;dialog.querySelector('.entry-track').setAttribute('aria-valuenow',progress);dialog.querySelector('.entry-track i').style.transform=`scaleX(${progress/100})`;if(label)dialog.querySelector('.entry-status').textContent=label;}
  function complete(fallback=false){if(disposed)return;if(ready){if(!fallback)dialog.querySelector('.entry-status').textContent='Your ocean is ready';return;}update(99);ready=true;dialog.dataset.ready='true';dialog.querySelector('.entry-number').innerHTML='100<small>/ 100</small>';dialog.querySelector('.entry-track').setAttribute('aria-valuenow','100');dialog.querySelector('.entry-track i').style.transform='scaleX(1)';dialog.querySelector('.entry-status').textContent=fallback?'A quieter ocean is ready':'Your ocean is ready';dialog.querySelector('.entry-enter').innerHTML='Enter with sound <span>↗</span>';dialog.querySelectorAll('button').forEach(b=>b.disabled=false);dialog.querySelector('.entry-enter').focus({preventScroll:true});}
  function destroy(){if(disposed)return;disposed=true;film.pause();reduced.removeEventListener('change',syncMotion);dialog.close();dialog.remove();document.body.style.overflow=previousOverflow;}
  function enter(sound){if(!ready||disposed)return;onEnter(sound);dialog.classList.add('entry-leaving');dialog.querySelectorAll('button').forEach(b=>b.disabled=true);setTimeout(()=>{destroy();document.querySelector('.hero h1')?.setAttribute('tabindex','-1');document.querySelector('.hero h1')?.focus({preventScroll:true});},reduced.matches?0:1100);}
  dialog.querySelector('.entry-enter').onclick=()=>enter(true);dialog.querySelector('.entry-silent').onclick=()=>enter(false);dialog.addEventListener('cancel',e=>{e.preventDefault();if(ready)enter(false);});
  return {update,complete,destroy};
}
