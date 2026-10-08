import '@fontsource/manrope/latin-400.css';
import '@fontsource/manrope/latin-500.css';
import '@fontsource/manrope/latin-600.css';
import '@fontsource/cormorant-garamond/latin-400.css';
import '@fontsource/cormorant-garamond/latin-400-italic.css';
import './style.css';
import { progressAt } from './journey-progress.js';
import { createOceanEntry } from './ocean-entry.js';
import { setMusic, setMusicVolume } from './soundtrack.js';

const app = document.querySelector('#app');
const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M5 19 19 5M5 5h14v14"/></svg>';
const down = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M12 4v16m-6-6 6 6 6-6"/></svg>';
const bag = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M5 8h14l1 13H4L5 8Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/></svg>';
const emblem = '<svg class="emblem" viewBox="0 0 70 70" fill="none" stroke="currentColor" stroke-width="1.2"><ellipse cx="35" cy="35" rx="12" ry="25" transform="rotate(-30 35 35)"/><ellipse cx="35" cy="35" rx="12" ry="25" transform="rotate(30 35 35)"/><path d="M14 35h42"/></svg>';
let world, sound = false, activeArticle = null, entry, enteredOcean = false, musicVolume = 45;
let motionReduced = false;
try { motionReduced = localStorage.getItem('nerea-motion') === 'reduced'; } catch {}
let storedCart;
try { storedCart = JSON.parse(localStorage.getItem('nerea-cart') || '[]'); } catch { storedCart = []; }
let cart = Array.isArray(storedCart) ? storedCart.filter(i => [1, 2, 3].includes(i.pack) && Number.isInteger(i.quantity) && i.quantity > 0 && i.quantity <= 20) : [];
const price = pack => [0, 38, 72, 102][pack];
const money = n => '$' + n.toFixed(2);
const cartCount = () => cart.reduce((n, i) => n + i.quantity * i.pack, 0);
const articles = [
  { slug: 'a-slower-kind-of-ritual', title: 'A slower kind of ritual.', category: 'EVERYDAY', date: '01 OCT 2026', intro: 'Small moments, repeated with intention. An invitation to make a little room in your day.', body: ['A ritual begins with attention. The same glass, a familiar corner of the kitchen, a moment before the day gathers speed. What makes it a ritual is the care you bring to it.', 'For the NERÉA concept, we started with that quiet moment. The bottle is designed to feel at home on a shelf: a considered object with a calm label and a simple shape. It is a reminder to pause, rather than another demand on your attention.', 'Try choosing one moment you already enjoy. Open a window. Set your phone aside while the kettle warms. Let that moment stay small enough to repeat. There is no perfect version, only the one that fits your everyday.'] },
  { slug: 'a-world-below-the-surface', title: 'A world below the surface.', category: 'THE OCEAN', date: '28 SEP 2026', intro: 'Looking a little closer at the shapes, textures, and quiet rhythms that inspired NERÉA.', body: ['The sea changes its palette by the hour. Indigo before dawn, a pale blush at the horizon, deep violet where light begins to fade. These colors became the chapters of our visual world.', 'Rock formations, drifting particles, and soft reflections give the scene its sense of distance. We designed the product to remain the still point among them: the same bottle and label from the first chapter to the last.', 'Our ocean is an imagined landscape, built as a connected three-dimensional world of rock, water, and marine forms. It is a design exploration of marine textures, rather than a photograph of a sourcing location. Its invitation is simple: look closer.'] },
  { slug: 'less-but-considered', title: 'Less, but considered.', category: 'BY DESIGN', date: '22 SEP 2026', intro: 'A closer look at the decisions behind a bottle made to belong in your everyday.', body: ['We began by removing. A quiet label. A single emblem. Enough information to understand the object without competing for attention. The space between elements matters as much as the elements themselves.', 'Our original emblem comes from two intersecting forms, a nod to leaves and the movement of water. An editorial serif introduces softness while a clear sans serif keeps the details easy to read.', 'NERÉA is a concept product. The materials, pack sizes, and price shown here illustrate an experience; real manufacturing, sourcing, formulation, and quality information would need to be provided before launch. Thoughtful design includes being clear about what an object is.'] }
];

function header(light = false) {
  return `<header class="site-header ${light ? 'on-light' : ''}"><nav class="nav-left" aria-label="Main navigation"><a class="nav-shop" data-route href="/product">Shop</a><a data-route href="/journal">Journal</a><a data-route href="/#ritual">Our story</a></nav><a class="wordmark" data-route href="/" aria-label="NERÉA home">NERÉA<span>®</span></a><div class="nav-right"><a class="header-shop" data-route href="/product">SEA MOSS ${arrow}</a><button class="cart-toggle" aria-label="Open shopping bag">${bag}<span class="bag-count">${cartCount()}</span></button><button class="menu-toggle" aria-label="Open navigation" aria-expanded="false"><span></span><span></span></button></div></header><nav class="mobile-nav" aria-label="Mobile navigation" hidden><a data-route href="/product">Sea moss ${arrow}</a><a data-route href="/journal">Journal ${arrow}</a><a data-route href="/#ritual">Our story ${arrow}</a></nav>`;
}
function footer(dark = false) {
  return `<footer class="footer ${dark ? 'footer-dark' : ''}"><div class="footer-top"><a data-route href="/" class="footer-brand">neréa<span>®</span></a><p>A little ocean.<br>A daily ritual.</p><div><a data-route href="/product">Discover sea moss ${arrow}</a><a data-route href="/journal">Read the journal ${arrow}</a></div></div><div class="footer-bottom"><span>© 2026 NERÉA</span><span>AN ORIGINAL OCEAN-INSPIRED CONCEPT</span><button class="about-demo">About this concept ${arrow}</button></div></footer>`;
}
function specimenArtwork() {
  const marks=[];
  const leaf=(x,y,angle,length,width,opacity)=>`<path d="M 0 0 Q ${-width} ${-length*.42} 0 ${-length} Q ${width} ${-length*.48} 0 0" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle.toFixed(1)})" fill="rgba(187,166,124,${opacity})" stroke="rgba(222,204,161,.72)" stroke-width=".8"/>`;
  for(let s=0;s<11;s++){
    const fan=(s-5)/5,baseX=300+fan*11,baseY=515,endX=300+fan*188,endY=120+(s%4)*19;
    marks.push(`<path d="M ${baseX} ${baseY} C ${baseX+fan*21} 385, ${endX-fan*53} 236, ${endX} ${endY}" fill="none" stroke="rgba(221,204,167,.78)" stroke-width="${(2.2-Math.abs(fan)*.6).toFixed(2)}" stroke-linecap="round"/>`);
    for(let n=1;n<=8;n++){
      const t=n/10,y=baseY+(endY-baseY)*t,x=baseX+(endX-baseX)*(t*t*(3-2*t));
      for(const side of [-1,1]){
        const offset=side*(9+t*16),w=5+(n%3)*2.3,len=31+(s+n)%4*8;
        marks.push(`<path d="M ${x.toFixed(1)} ${y.toFixed(1)} Q ${(x+offset*.65).toFixed(1)} ${(y-len*.52).toFixed(1)} ${(x+offset).toFixed(1)} ${(y-len).toFixed(1)}" fill="none" stroke="rgba(210,187,146,.68)" stroke-width="1"/>`);
        marks.push(leaf(x+offset,y-len,side*31+fan*18,len*.75,w,.20+(n%3)*.04));
      }
    }
  }
  return `<div class="specimen-art" aria-hidden="true"><span class="specimen-index">NERÉA / FIELD STUDY 03</span><svg viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="300" cy="300" r="244" stroke="rgba(208,188,153,.42)" stroke-width=".8"/><circle cx="300" cy="300" r="231" stroke="rgba(208,188,153,.22)" stroke-width=".6"/><path d="M 300 55 V 28 M 300 545 V 572 M 55 300 H 28 M 545 300 H 572" stroke="rgba(208,188,153,.48)"/>${marks.join('')}<path d="M 268 512 Q 300 496 332 512" stroke="rgba(224,205,166,.9)" stroke-width="2"/><text x="300" y="585" text-anchor="middle" fill="#c9b795" font-family="Manrope,sans-serif" font-size="10" letter-spacing="4">CHONDRUS · AN IMAGINED STUDY</text></svg><span class="specimen-coordinate">03° / 42′ / THE WORLD WITHIN</span></div>`;
}
function home() {
  return `${header()}<div id="world" class="world">
    <picture class="scene-poster"><source media="(max-width:700px)" srcset="/poster-mobile.jpg"/><img src="/poster-desktop.jpg" alt="NERÉA's dark jar on stone above a misty ocean"/></picture>
  </div><div class="scene-status" role="status"><span>${emblem}</span><span id="load-status">Preparing your ocean…</span></div>
  <main class="journey" id="main">
    <section class="chapter hero" id="arrival" data-chapter="0">
      <div class="hero-heading"><span class="eyebrow">NERÉA / THE DAILY RITUAL</span><h1><em>A little ocean.</em><br>A daily ritual.</h1></div>
      <div class="hero-aside"><p>Something extraordinary.<br>From the deep, to your everyday.</p><a class="scroll-link" href="#ritual" aria-label="Explore the ocean"><span>EXPLORE THE OCEAN</span><span class="round">${down}</span></a></div>
    </section>
    <section class="chapter promise" id="ritual" data-chapter="1">
      <div class="center-copy"><span class="eyebrow">THE ORIGIN / NERÉA</span><h2>Rooted in<br><em>the ocean.</em></h2><p class="shore-story">Seaweed, stone and the rhythm of the tide.<br>An everyday ritual, shaped by the sea.</p><a class="pill primary" data-route href="/product">Explore the ritual <span>${arrow}</span></a></div>
      <div class="ocean-note"><p>SEAWEED. STONE. SALT AIR.</p><a class="text-link" data-route href="/journal/a-world-below-the-surface">Our world ${arrow}</a></div>
    </section>
    <section class="chapter details" id="inside" data-chapter="2">
      <div class="detail-copy"><span class="eyebrow">THE WORLD WITHIN</span><h2>An ocean,<br><em>unfolded.</em></h2>
        <article class="feature-story" id="feature-0" role="tabpanel" aria-labelledby="tab-0"><h3>A small study of the sea.</h3><p>Delicate marine forms become an original botanical drawing, suspended in the underwater landscape.</p></article>
        <article class="feature-story" id="feature-1" role="tabpanel" aria-labelledby="tab-1" hidden><h3>Look a little closer.</h3><p>Individual stems, blades and branching lines reveal the delicate structure of our imagined specimen.</p></article>
        <article class="feature-story" id="feature-2" role="tabpanel" aria-labelledby="tab-2" hidden><h3>Gathered by the tide.</h3><p>Its lines settle into a quiet whole. A marine study drawn with the patience of a natural collection.</p></article>
      </div>
      ${specimenArtwork()}<div class="inspection" role="tablist" aria-label="Specimen details">${['The seed','The unfolding','The balance'].map((name,i)=>`<button id="tab-${i}" role="tab" aria-selected="${i===0}" aria-controls="feature-${i}" tabindex="${i===0?0:-1}" data-inspect="${i}"><span>0${i+1}</span> ${name} <b>+</b></button>`).join('')}</div>
    </section>
    <section class="chapter invitation" id="begin" data-chapter="3"><div class="hero-heading"><h2>Follow<br><em>the tide.</em></h2></div><div class="hero-aside"><p>Every tide returns.<br>Begin something of your own.</p><a class="pill primary" data-route href="/product">Begin your ritual <span>${arrow}</span></a></div></section>
  </main>
  <div class="journey-controls"><div class="ambient-controls"><button class="motion-toggle" aria-label="Reduce scene motion" aria-pressed="false">MOTION ON</button><button class="sound-toggle" aria-label="Enable ambient ocean sound" aria-pressed="false"><span class="sound-bars"><i></i><i></i><i></i><i></i></span><span class="sound-label">SOUND OFF</span></button></div><nav class="chapter-nav" aria-label="Journey chapters">${['arrival','ritual','inside','begin'].map((id,i)=>`<a href="#${id}" class="${i===0?'active':''}" aria-label="Chapter ${i+1}: ${['Arrival','The ocean','The specimen','Begin your ritual'][i]}" ${i===0?'aria-current="step"':''}><i></i></a>`).join('')}</nav><span class="journey-tag">FROM THE DEEP, WITH INTENTION</span></div>${footer(true)}`;
}
function product() {
  return `${header(true)}<main id="main" class="product-page page-light"><div class="breadcrumb"><a data-route href="/">Home</a><span>/</span><span>The daily ritual</span></div><div class="product-grid"><div class="gallery"><div class="gallery-main"><img id="gallery-image" src="/product-render.jpg" alt="NERÉA sea moss concept bottle with a dark plum finish, gold emblem, and matte lid"/><span class="gallery-caption">THE DAILY RITUAL / 01</span><button class="gallery-next" aria-label="Next product image">${arrow}</button></div><div class="gallery-thumbs" role="group" aria-label="Product gallery"><button class="selected" data-gallery="0" aria-label="View bottle" aria-pressed="true"><img src="/product-render.jpg" alt=""/></button><button data-gallery="1" aria-label="View ocean scene" aria-pressed="false"><img src="/poster-desktop.jpg" alt=""/></button><button data-gallery="2" aria-label="View label detail" aria-pressed="false"><img class="detail-thumb" src="/product-render.jpg" alt=""/></button><span>MADE TO BELONG<br>IN YOUR EVERYDAY.</span></div></div><div class="product-info"><span class="eyebrow">NERÉA / THE DAILY RITUAL</span><h1>Sea moss.<br><em>Simply considered.</em></h1><p class="product-intro">A little ocean, in one little bottle. Discover our sea moss concept: an imagined marine ritual, brought to life through thoughtful design.</p><div class="product-meta"><span>60 CAPSULES PER BOTTLE</span><span>CONCEPT EDITION</span></div><fieldset class="pack-field"><legend>Choose your ritual</legend><div class="pack-options">${[1, 2, 3].map((n, i) => `<label><input type="radio" name="pack" value="${n}" ${i === 0 ? 'checked' : ''}/><span>${n} ${n === 1 ? 'bottle' : 'bottles'}<small>${money(price(n))}</small></span></label>`).join('')}</div></fieldset><div class="purchase-row"><div class="quantity"><button class="quantity-minus" aria-label="Decrease quantity">−</button><output id="quantity">1</output><button class="quantity-plus" aria-label="Increase quantity">+</button></div><button class="add-to-bag pill dark">Add to demo bag <span id="product-price">$38.00</span>${arrow}</button></div><p class="demo-note">Demo shopping experience. Sample prices in USD. No orders or payments are processed.</p><div class="accordions"><details open><summary>The concept <span>+</span></summary><p>NERÉA is an original ocean-inspired brand concept. The bottle, capsule, and pack sizes illustrate a product experience. It is not currently available to purchase.</p></details><details><summary>Ingredients & formulation <span>+</span></summary><p>Sea moss inspires this concept. A real ingredient list, capsule material, serving size, and verified formulation must be supplied by a manufacturer before launch.</p></details><details><summary>Packaging & product details <span>+</span></summary><p>The imagined 60-capsule bottle features a dark plum finish, a ribbed matte lid, and original gold detailing. Final materials and dimensions are not specified.</p></details><details><summary>Delivery & returns <span>+</span></summary><p>This is a demonstration store. No shipping, billing, or payment details are collected, and no products are dispatched.</p></details></div></div></div><section class="product-story"><span class="eyebrow">A MOMENT TO YOURSELF</span><h2>Nature is the inspiration.<br><em>You make it a ritual.</em></h2><a class="pill outline" data-route href="/#ritual">Take the ocean journey <span>${arrow}</span></a></section><section class="related-reading"><div class="section-heading"><h2>A little more <em>perspective.</em></h2><a data-route href="/journal" class="text-link">The journal ${arrow}</a></div>${articleCards(2)}</section></main>${footer()}`;
}
function articleCards(count = 3) {
  return `<div class="article-grid">${articles.slice(0, count).map((a, i) => `<a class="article-card" data-route href="/journal/${a.slug}"><div class="article-art art-${i}">${i === 0 ? `<img src="/product-render.jpg" alt="NERÉA bottle in a soft lavender setting"/>` : i === 1 ? '<div class="art-moon"></div><div class="art-water"></div><div class="art-stone"></div>' : emblem}<span>${arrow}</span></div><div class="article-meta"><span>${a.category}</span><time>${a.date}</time></div><h3>${a.title}</h3><p>${a.intro}</p><span class="read-story">READ THE STORY ${arrow}</span></a>`).join('')}</div>`;
}
function journal() {
  return `${header(true)}<main id="main" class="journal-page page-light"><div class="journal-heading"><span class="eyebrow">NOTES FROM OUR WORLD</span><h1>A little depth.<br>A new <em>perspective.</em></h1><p>On the ocean, considered design,<br>and the art of an everyday ritual.</p></div><div class="journal-filter"><span>THE JOURNAL</span><span>03 STORIES</span></div>${articleCards()}</main>${footer()}`;
}
function article(a) {
  return `${header(true)}<main id="main" class="article-page page-light"><a class="text-link" data-route href="/journal">← Back to the journal</a><div class="article-header"><span class="eyebrow">${a.category} / ${a.date}</span><h1>${a.title.replace(/(ritual|surface|considered)/, '<em>$1</em>')}</h1><p>${a.intro}</p></div><div class="article-body">${a.body.map(p => `<p>${p}</p>`).join('')}<aside>From the NERÉA concept journal. Original editorial content exploring our imagined brand and visual world.</aside><a class="pill dark" data-route href="/product">Discover the ritual <span>${arrow}</span></a></div></main>${footer()}`;
}
function navigate(url, push = true) {
  const next = new URL(url, location.origin);
  if (next.pathname === location.pathname && next.hash && document.querySelector(next.hash)) {
    if (push) history.pushState({}, '', next); document.querySelector(next.hash).scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); return;
  }
  if (push) history.pushState({}, '', next);
  render();
}
function render() {
  entry?.destroy(); entry = null;
  world?.destroy(); world = null;
  const path = location.pathname.replace(/\/$/, '') || '/';
  activeArticle = articles.find(a => path === `/journal/${a.slug}`);
  const isHome = path === '/';
  document.body.className = (isHome ? 'is-home' : 'is-inner') + (motionReduced ? ' reduce-motion' : '') + (new URLSearchParams(location.search).has('poster') ? ' poster-render' : '');
  app.innerHTML = path === '/product' ? product() : path === '/journal' ? journal() : activeArticle ? article(activeArticle) : isHome ? home() : `${header(true)}<main class="not-found page-light"><span class="eyebrow">A LITTLE OFF COURSE / 404</span><h1>Back to the <em>ocean.</em></h1><p>This page doesn’t exist. Your journey is waiting.</p><a class="pill dark" href="/" data-route>Return home ${arrow}</a></main>${footer()}`;
  app.insertAdjacentHTML('afterbegin', '<a class="skip-link" href="#main">Skip to content</a>');
  if (!isHome) app.insertAdjacentHTML('beforeend', '<div class="inner-audio"><button class="sound-toggle" aria-pressed="false"><span class="sound-bars"><i></i><i></i><i></i><i></i></span><span class="sound-label">SOUND OFF</span></button></div>');
  const soundButton = document.querySelector('.sound-toggle');
  soundButton.insertAdjacentHTML('afterend', `<input class="music-volume" type="range" min="0" max="100" value="${musicVolume}" aria-label="Soundtrack volume"/>`);
  soundButton.addEventListener('click', () => toggleSound(!sound));
  document.querySelector('.music-volume').addEventListener('input', e => { musicVolume = Number(e.target.value); setMusicVolume(musicVolume/100); });
  updateSoundControl();
  document.title = isHome ? 'NERÉA — A little ocean. A daily ritual.' : path === '/product' ? 'Sea moss — NERÉA' : activeArticle ? `${activeArticle.title} — NERÉA Journal` : 'The Journal — NERÉA';
  scrollTo({ top: 0, behavior: 'instant' });
  if (isHome) {
    document.querySelectorAll('.chapter').forEach(section => { const frame = document.createElement('div'); frame.className = 'chapter-frame'; frame.append(...section.childNodes); section.append(frame); });
    const container = document.querySelector('#world');
    const params = new URLSearchParams(location.search);
    if (!enteredOcean && !params.has('poster') && !params.has('studio')) entry = createOceanEntry(enabled => { enteredOcean = true; toggleSound(enabled); world?.startIntro(); });
    const openingEntry = entry;
    openingEntry?.update(8, 'Opening the horizon');
    const fallback = () => { if (!container.isConnected) return; container.classList.add('static-world'); document.querySelector('#load-status').textContent = 'Static ocean view ready.'; document.querySelector('.scene-status')?.classList.add('ready'); document.body.classList.add('static-mode'); document.querySelectorAll('.feature-story').forEach(p=>{p.hidden=false;p.removeAttribute('aria-hidden');}); openingEntry?.complete(true); };
    if (new URLSearchParams(location.search).get('view') === 'static') fallback();
    else {
      const timeout = setTimeout(fallback, 6000);
      Promise.all([document.fonts.ready, import('./experience.js')]).then(([, { createWorld }]) => {
        if (!container.isConnected) { clearTimeout(timeout); return; }
        openingEntry?.update(22, 'Shaping the water');
        world = createWorld(container, () => { clearTimeout(timeout); container.classList.remove('static-world'); document.body.classList.remove('static-mode'); container.classList.add('world-ready'); world?.refreshLayout(); if (location.hash) requestAnimationFrame(() => document.querySelector(location.hash)?.scrollIntoView({ behavior: 'instant' })); inspect(Number(document.querySelector('[data-inspect][aria-selected=true]')?.dataset.inspect || 0)); document.querySelector('#load-status').textContent = 'Your ocean is ready.'; document.querySelector('.scene-status')?.classList.add('ready'); openingEntry?.complete(); }, fallback, (value,label) => openingEntry?.update(value,label));
        window.nereaCapture = () => world?.capture();
      }).catch(error => { console.error('Unable to initialize the ocean scene:', error); fallback(); });
    }
    document.querySelectorAll('[data-inspect]').forEach(button => {
      button.addEventListener('click', () => inspect(Number(button.dataset.inspect)));
      button.addEventListener('keydown', e => { if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) { e.preventDefault(); const i = e.key === 'Home' ? 0 : e.key === 'End' ? 2 : (Number(button.dataset.inspect) + (['ArrowDown','ArrowRight'].includes(e.key) ? 1 : 2)) % 3; inspect(i); document.querySelector(`[data-inspect="${i}"]`).focus(); } });
    });
    const motionButton = document.querySelector('.motion-toggle');
    const updateMotion = () => { const reduced = motionReduced || matchMedia('(prefers-reduced-motion: reduce)').matches; motionButton.setAttribute('aria-pressed', String(reduced)); motionButton.setAttribute('aria-label', reduced ? 'Enable scene motion' : 'Reduce scene motion'); motionButton.textContent = reduced ? 'MOTION REDUCED' : 'MOTION ON'; };
    motionButton.addEventListener('click', () => { motionReduced = !motionReduced; try { localStorage.setItem('nerea-motion', motionReduced ? 'reduced' : 'full'); } catch {} document.body.classList.toggle('reduce-motion', motionReduced); updateMotion(); });
    updateMotion();
  }
  bindNavigation();
  if (path === '/product') bindProduct();
  if (location.hash) requestAnimationFrame(() => document.querySelector(location.hash)?.scrollIntoView({ behavior: 'instant' }));
}
function bindNavigation() {
  document.querySelectorAll('a[data-route], a[href^="#"]').forEach(a => a.addEventListener('click', e => { if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return; e.preventDefault(); const mobileNav = document.querySelector('.mobile-nav'); if (mobileNav && !mobileNav.hidden) { mobileNav.hidden = true; const menuButton = document.querySelector('.menu-toggle'); menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Open navigation'); } navigate(a.href); }));
  document.querySelector('.cart-toggle').addEventListener('click', openCart);
  document.querySelector('.menu-toggle').addEventListener('click', e => { const button = e.currentTarget, nav = document.querySelector('.mobile-nav'); nav.hidden = !nav.hidden; button.setAttribute('aria-expanded', String(!nav.hidden)); button.setAttribute('aria-label', nav.hidden ? 'Open navigation' : 'Close navigation'); });
  document.querySelectorAll('.about-demo').forEach(b => b.addEventListener('click', openAbout));
}
function inspect(i) {
  document.querySelectorAll('[data-inspect]').forEach(b => { const selected = Number(b.dataset.inspect) === i; b.setAttribute('aria-selected', String(selected)); b.tabIndex = selected ? 0 : -1; });
  document.querySelectorAll('.feature-story').forEach((panel,index)=>{panel.hidden=index!==i;});
  const specimen = document.querySelector('.specimen-art'); if (specimen) specimen.dataset.study = String(i);
  world?.inspect(i);
}
function bindProduct() {
  let quantity = 1, gallery = 0;
  const selectedPack = () => Number(document.querySelector('input[name="pack"]:checked').value);
  const update = () => { document.querySelector('#quantity').textContent = quantity; document.querySelector('#product-price').textContent = money(price(selectedPack()) * quantity); document.querySelector('.quantity-minus').disabled = quantity === 1; document.querySelector('.quantity-plus').disabled = quantity === 20; };
  document.querySelector('.quantity-minus').addEventListener('click', () => { quantity = Math.max(1, quantity - 1); update(); });
  document.querySelector('.quantity-plus').addEventListener('click', () => { quantity = Math.min(20, quantity + 1); update(); });
  document.querySelectorAll('input[name="pack"]').forEach(r => r.addEventListener('change', update));
  document.querySelector('.add-to-bag').addEventListener('click', () => { const pack = selectedPack(), existing = cart.find(i => i.pack === pack); if (existing) existing.quantity = Math.min(20, existing.quantity + quantity); else cart.push({ pack, quantity }); persistCart(); openCart(); });
  const showGallery = i => { gallery = i; const image = document.querySelector('#gallery-image'); image.src = i === 1 ? '/poster-desktop.jpg' : '/product-render.jpg'; image.className = i === 2 ? 'label-closeup' : ''; image.alt = ['NERÉA sea moss concept bottle', 'NERÉA in an original ocean landscape', 'Close-up of the NERÉA dark label'][i]; document.querySelector('.gallery-caption').textContent = `${['THE DAILY RITUAL', 'AN OCEAN OF INSPIRATION', 'EVERY DETAIL, CONSIDERED'][i]} / 0${i + 1}`; document.querySelectorAll('[data-gallery]').forEach(b => { const selected = Number(b.dataset.gallery) === i; b.classList.toggle('selected', selected); b.setAttribute('aria-pressed', String(selected)); }); };
  document.querySelectorAll('[data-gallery]').forEach(b => b.addEventListener('click', () => showGallery(Number(b.dataset.gallery))));
  document.querySelector('.gallery-next').addEventListener('click', () => showGallery((gallery + 1) % 3)); update();
}
function persistCart() { try { localStorage.setItem('nerea-cart', JSON.stringify(cart)); } catch {} document.querySelectorAll('.bag-count').forEach(b => b.textContent = cartCount()); }
let returnFocus;
function openDialog(content, className = '') {
  if (!document.querySelector('dialog')) returnFocus = document.activeElement;
  closeDialog(false);
  const dialog = document.createElement('dialog'); dialog.className = `overlay-dialog ${className}`; dialog.innerHTML = content;
  dialog.setAttribute('aria-label', className === 'cart-drawer' ? 'Shopping bag' : 'About the NERÉA concept');
  document.body.appendChild(dialog); document.body.style.overflow = 'hidden'; dialog.showModal();
  dialog.addEventListener('close', () => { if (dialog.isConnected) closeDialog(); });
  dialog.addEventListener('click', e => { if (e.target === dialog) closeDialog(); });
  dialog.querySelector('.close-dialog')?.addEventListener('click', closeDialog); return dialog;
}
function closeDialog(restore = true) { const d = document.querySelector('dialog'); if (d) { d.close(); d.remove(); } document.body.style.overflow = ''; if (restore) returnFocus?.focus(); }
function openCart() {
  const total = cart.reduce((n, i) => n + price(i.pack) * i.quantity, 0);
  const dialog = openDialog(`<div class="drawer-header"><span class="eyebrow">YOUR DAILY RITUAL</span><button class="close-dialog" aria-label="Close shopping bag">×</button></div><h2>Your <em>bag.</em><span>${cartCount()}</span></h2><div class="cart-items">${cart.length ? cart.map((item, i) => `<div class="cart-item"><img src="/product-render.jpg" alt="NERÉA sea moss bottle"/><div><h3>NERÉA Sea moss</h3><p>${item.pack}-bottle pack · Concept edition</p><div class="cart-item-actions"><button data-cart-minus="${i}" aria-label="Decrease ${item.pack}-bottle pack quantity">−</button><span>${item.quantity}</span><button data-cart-plus="${i}" aria-label="Increase ${item.pack}-bottle pack quantity" ${item.quantity >= 20 ? 'disabled' : ''}>+</button><button class="remove-item" data-remove="${i}">Remove</button></div></div><span>${money(price(item.pack) * item.quantity)}</span></div>`).join('') : `<div class="empty-bag">${emblem}<p>A little room for<br><em>your next ritual.</em></p><button class="pill dark cart-discover">Discover sea moss ${arrow}</button></div>`}</div>${cart.length ? `<div class="cart-total"><span>Sample subtotal</span><strong>${money(total)}</strong></div><button class="pill dark demo-checkout">Explore demo checkout ${arrow}</button>` : ''}<p class="demo-note">This is a concept store. Prices are illustrative.<br>No payment is collected and no order is placed.</p>`, 'cart-drawer');
  dialog.querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', () => { cart.splice(Number(b.dataset.remove), 1); persistCart(); openCart(); }));
  for (const type of ['minus', 'plus']) dialog.querySelectorAll(`[data-cart-${type}]`).forEach(b => b.addEventListener('click', () => { const i = Number(b.dataset[type === 'minus' ? 'cartMinus' : 'cartPlus']); cart[i].quantity += type === 'minus' ? -1 : 1; if (cart[i].quantity <= 0) cart.splice(i, 1); persistCart(); openCart(); }));
  dialog.querySelector('.cart-discover')?.addEventListener('click', () => { closeDialog(); navigate('/product'); });
  dialog.querySelector('.demo-checkout')?.addEventListener('click', () => {
    dialog.querySelector('.cart-items').innerHTML = `<div class="checkout-preview">${emblem}<h3>Your ritual, <em>imagined.</em></h3><p>This is the end of the demo shopping journey. A live store would connect to secure checkout here.</p><p>No order has been placed. Your demo bag remains available to edit.</p><button class="pill outline back-to-bag">Back to your bag ${arrow}</button></div>`;
    dialog.querySelector('.demo-checkout').hidden = true; dialog.querySelector('.back-to-bag').addEventListener('click', openCart);
  });
}
function openAbout() { openDialog(`<button class="close-dialog" aria-label="Close concept information">×</button>${emblem}<span class="eyebrow">AN ORIGINAL CONCEPT</span><h2>An ocean of<br><em>possibility.</em></h2><p>NERÉA is an original brand and website concept inspired by the ocean. The product, packaging, pack sizes, and prices are illustrative.</p><p>No product reviews, sourcing certifications, or health benefits are claimed. This demo does not process payments or orders.</p><a class="pill dark" href="/product" data-route>Explore the product ${arrow}</a>`, 'about-dialog').querySelector('[data-route]').addEventListener('click', e => { e.preventDefault(); closeDialog(); navigate('/product'); }); }
function updateSoundControl() {
  const button = document.querySelector('.sound-toggle');
  if (button) { button.setAttribute('aria-pressed', String(sound)); button.setAttribute('aria-label', sound ? 'Mute ocean soundtrack' : 'Play ocean soundtrack'); button.querySelector('.sound-label').textContent = sound ? 'SOUND ON' : 'SOUND OFF'; }
}
async function toggleSound(value) {
  sound = value;
  updateSoundControl();
  const enabled = await setMusic(value);
  if (sound === value) { sound = enabled; updateSoundControl(); }
}
let ticking = false;
addEventListener('scroll', () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { ticking = false; const chapters = [...document.querySelectorAll('.chapter')].map(c => ({top:c.offsetTop,height:c.offsetHeight})), p = progressAt(scrollY, chapters), index = Math.floor(p); document.querySelectorAll('.chapter-nav a').forEach((a, i) => { a.classList.toggle('active', i === index); if (i === index) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current'); }); document.querySelector('.site-header')?.classList.toggle('scrolled', scrollY > 40); const footerTop = document.querySelector('.footer')?.getBoundingClientRect().top ?? innerHeight; document.querySelector('.journey-controls')?.classList.toggle('hidden-controls', footerTop < innerHeight * .9); world?.setActive(footerTop > 0); }); }, { passive: true });
addEventListener('popstate', () => render());

render();

