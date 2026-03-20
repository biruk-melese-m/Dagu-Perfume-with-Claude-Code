// ── CURSOR ──────────────────────────────────────────────────────
const cur=document.getElementById('cur'),cur2=document.getElementById('cur2');
let mx=0,my=0,fx=0,fy=0;
document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;cur.style.left=mx+'px';cur.style.top=my+'px';});
(function a(){fx+=(mx-fx)*.1;fy+=(my-fy)*.1;cur2.style.left=fx+'px';cur2.style.top=fy+'px';requestAnimationFrame(a);})();
document.addEventListener('mouseover',e=>{if(e.target.closest('button,a,.pcard,.snav-item,.pill'))document.body.classList.add('hov');});
document.addEventListener('mouseout',e=>{if(e.target.closest('button,a,.pcard,.snav-item,.pill'))document.body.classList.remove('hov');});

// ── PRELOADER ──────────────────────────────────────────────────
setTimeout(()=>{document.getElementById('preloader').classList.add('ready');},200);
setTimeout(()=>{document.getElementById('preloader').classList.add('out');},2000);
setTimeout(()=>{document.getElementById('preloader').style.display='none';},3200);

// ── HEADER SCROLL ──────────────────────────────────────────────
window.addEventListener('scroll',()=>{
  document.getElementById('mainHeader').classList.toggle('scrolled',window.scrollY>80);
},{passive:true});

// ── HERO CANVAS ────────────────────────────────────────────────
(function(){
  const cv=document.getElementById('heroCanvas');
  const ctx=cv.getContext('2d');
  let W,H;
  const resize=()=>{W=cv.width=window.innerWidth;H=cv.height=window.innerHeight;};
  resize(); window.addEventListener('resize',resize);
  let mouseX=W/2,mouseY=H/2;
  document.getElementById('hero').addEventListener('mousemove',e=>{mouseX=e.clientX;mouseY=e.clientY;});
  const particles=Array.from({length:60},()=>({
    x:Math.random(),y:Math.random()*1.2,vy:-(Math.random()*.5+.2),
    vx:(Math.random()-.5)*.15,r:Math.random()*2+.3,
    life:Math.random(),gold:Math.random()<.25
  }));
  let t=0;
  const drawBottle=(cx,cy,s,a)=>{
    ctx.save();ctx.globalAlpha=a;ctx.translate(cx,cy);
    
    // Silhouette base setup
    ctx.shadowBlur = 25;
    ctx.shadowColor = `rgba(200, 160, 80, ${a})`; // Gold glow
    ctx.strokeStyle = `rgba(200, 160, 80, ${a})`;
    ctx.lineWidth = 2;

    // Main bottle body (Sleek heavy glass block)
    ctx.beginPath();
    ctx.rect(-s*0.35, -s*0.4, s*0.7, s*0.9);
    ctx.stroke();
    
    // Internal base thickness (heavy glass bottom)
    ctx.beginPath();
    ctx.moveTo(-s*0.3, s*0.4);
    ctx.lineTo(s*0.3, s*0.4);
    ctx.strokeStyle = `rgba(110, 19, 36, ${a})`; // Brand red glow base
    ctx.stroke();

    // Center luxury label plate
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.rect(-s*0.18, -s*0.1, s*0.36, s*0.36);
    ctx.stroke();
    
    // Minimalist lines inside label
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-s*0.08, 0); ctx.lineTo(s*0.08, 0);
    ctx.moveTo(-s*0.04, s*0.1); ctx.lineTo(s*0.04, s*0.1);
    ctx.stroke();

    // Neck ring
    ctx.lineWidth = 2;
    ctx.strokeStyle = `rgba(200, 160, 80, ${a})`;
    ctx.shadowColor = `rgba(200, 160, 80, ${a})`;
    ctx.beginPath();
    ctx.rect(-s*0.1, -s*0.48, s*0.2, s*0.08);
    ctx.stroke();

    // Heavy Cap (T-shaped or block)
    ctx.beginPath();
    ctx.shadowBlur = 20;
    ctx.shadowColor = `rgba(110, 19, 36, ${a})`;
    ctx.strokeStyle = `rgba(110, 19, 36, ${a})`;
    ctx.rect(-s*0.2, -s*0.78, s*0.4, s*0.3);
    ctx.stroke();

    ctx.restore();
  };
  const draw=()=>{
    ctx.clearRect(0,0,W,H);
    const bg=ctx.createRadialGradient(W*.5,H*.4,0,W*.5,H*.4,W*.7);
    bg.addColorStop(0,'rgba(110,19,36,.08)');bg.addColorStop(1,'rgba(14,6,8,0)');
    ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
    particles.forEach(p=>{
      p.x+=p.vx*.001;p.y+=p.vy*.001;p.life+=.003;
      if(p.y<-.1){p.y=1.1;p.x=Math.random();}
      const alpha=p.life%1;const fade=alpha<.1?alpha*10:alpha>.8?(1-alpha)*5:1;
      ctx.beginPath();ctx.arc(p.x*W,p.y*H,p.r,0,Math.PI*2);
      ctx.fillStyle=p.gold?`rgba(200,160,80,${fade*.5})`:`rgba(110,19,36,${fade*.4})`;
      ctx.fill();
    });
    const fl=Math.sin(t*.008)*14;
    const mx2=(mouseX/W-.5),my2=(mouseY/H-.5);
    
    // Draw one massive stylish centerpiece bottle, aligned to the right on desktop
    const cx = W > 768 ? W * 0.68 : W * 0.5;
    drawBottle(cx + mx2*30, H*.45 + fl + my2*20, Math.min(W,H)*0.45, 0.95);
    
    t++;requestAnimationFrame(draw);
  };
  draw();
})();

// ── DATA ────────────────────────────────────────────────────────
const BOTTLE_IMGS={
  fresh:'🌊',floral:'🌸',woody:'🪵',oud:'🕌',sweet:'🍯',
  spicy:'🌶️',oriental:'🌙',leather:'🧥',fruity:'🍑',gourmand:'🍫',aquatic:'🌊',misc:'🎁'
};
function getEmoji(tags,gender){
  if(tags.includes('oud'))return'🕌';
  if(tags.includes('floral')&&gender==='w')return'🌸';
  if(tags.includes('gourmand'))return'🍫';
  if(tags.includes('fresh')&&tags.includes('aquatic'))return'🌊';
  if(tags.includes('woody'))return'🪵';
  if(tags.includes('sweet'))return'🍯';
  if(tags.includes('fruity'))return'🍑';
  if(tags.includes('spicy'))return'🌶️';
  if(gender==='m')return'🏺';
  if(gender==='w')return'🌺';
  return'🫧';
}
const SEC_COLORS={
  'sec-kings':'rgba(74,100,160,.25)',
  'sec-queens':'rgba(160,60,100,.25)',
  'sec-oud':'rgba(160,120,40,.25)',
  'sec-fresh':'rgba(40,140,160,.25)',
  'sec-woody':'rgba(120,80,40,.25)',
  'sec-sweet':'rgba(160,100,40,.25)',
  'sec-unisex':'rgba(60,140,80,.25)',
  'sec-designer':'rgba(160,140,60,.25)',
  'sec-sets':'rgba(100,60,140,.25)',
};

const SECTIONS=[
  {id:'sec-unisex',emoji:'⚖️',tag:'Iconic Unisex',title:'Iconic Unisex',sub:'Timeless signatures that transcend gender — worn by everyone, remembered by all.'},
  {id:'sec-kings',emoji:'👑',tag:"Men's Collection",title:'For Kings',sub:'Bold, commanding and unforgettable — the finest men\'s fragrances from beast-mode Lattafas to iconic designer originals.'},
  {id:'sec-queens',emoji:'🌹',tag:"Women's Collection",title:'For Queens',sub:'From dreamy florals to addictive gourmands — every statement of elegance and confidence.'},
  {id:'sec-oud',emoji:'🕌',tag:'Oud & Arabian',title:'Oud & Arabian Treasures',sub:'Deep resins, smoky amber, and centuries of Middle Eastern perfumery tradition.'},
  {id:'sec-fresh',emoji:'🌊',tag:'Fresh & Aquatic',title:'Fresh & Aquatic',sub:'Clean, crisp, and alive — perfect for daily wear, warm days, and effortless confidence.'},
  {id:'sec-woody',emoji:'🪵',tag:'Woody & Leather',title:'Woody & Leathery',sub:'Rich sandalwood, smoky vetiver, and raw leather — scents that leave a lasting trail.'},
  {id:'sec-sweet',emoji:'🍯',tag:'Sweet & Gourmand',title:'Sweet & Gourmand',sub:'Vanilla, caramel, cocoa and sugar rush — the most addictive and crowd-pleasing profiles.'},
  {id:'sec-designer',emoji:'💎',tag:'Designer Originals & Testers',title:'Designer Originals',sub:'Authentic originals and testers from Chanel, Dior, Tom Ford, YSL and more — the real deal.'},
  {id:'sec-sets',emoji:'🎁',tag:'Sets, Splashes & More',title:'Sets, Splashes & Extras',sub:'Gift sets, body splashes, mini vials, kids perfumes and budget daily-wear picks.'},
];

// ── POPULAR FIRST: prioritized no.s per section ──────────────────
// These IDs will be sorted to the top of their section
const POPULAR_IDS = {
  // Woody section - Now Rave is popular
  'sec-woody': [77, 323, 11, 37, 38],
  // Kings section
  'sec-kings': [35, 44, 97, 98, 99, 100],
  // Queens section
  'sec-queens': [45, 46, 48, 41],
  // Unisex section - Aventus, Sauvage mixes popular
  'sec-unisex': [20, 52, 12, 28, 29, 31],
  // Oud
  'sec-oud': [15, 25, 26, 33],
  // Fresh
  'sec-fresh': [40, 16, 19, 9],
  // Sweet
  'sec-sweet': [6, 27, 323, 161, 4, 2],
  // Designer
  'sec-designer': [43, 51, 42],
  // Sets
  'sec-sets': [41],
};

function sortByPopularity(items, secId) {
  const priority = POPULAR_IDS[secId] || [];
  if (!priority.length) return items;
  return [...items].sort((a, b) => {
    const ai = priority.indexOf(a.no);
    const bi = priority.indexOf(b.no);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

// ── AMHARIC NAME CLEANER ─────────────────────────────────────────
// Returns true if string is mostly Amharic (Ethiopic) script
function isMostlyAmharic(str) {
  if (!str) return false;
  const amLen = [...str].filter(c => c >= '\u1200' && c <= '\u137f').length;
  return amLen > str.length * 0.3;
}

function getCleanName(p) {
  const name = p.name || '';
  const brand = p.brand || '';
  const vibe = p.vibe || '';
  
  // If name is mostly Amharic, try to extract English from vibe or use known translation
  if (isMostlyAmharic(name)) {
    // Try to find English perfume name in vibe (look for capitalized words)
    const englishMatch = vibe.match(/([A-Z][A-Za-z\s'&.,-]+(?:Perfume|EDP|EDT|Eau|Pour|For|Dior|Chanel|Lattafa|Armani|Versace|Tom Ford|YSL|Creed|Rasasi|Afnan|Khamrah|Aventus|Sauvage|Rave|Club|Maison|Marly|Parfums|Intense|Elixir|Black|Blue|Gold|Silver|White|Rouge|Oud|Amber|Vanilla|Musk|Rose|Jasmine|Eros|Olympea|Legend|Invictus|One Million|Boss|Hugo)[A-Za-z\s'&.,()-]*)/)
      || vibe.match(/([A-Z][A-Za-z\s'&]{3,40}(?:\d+ml)?)/)
      || name.match(/([A-Za-z][A-Za-z\s'&.,()-]{4,50})/);
    
    if (englishMatch) {
      return englishMatch[1].trim().replace(/\s+/g, ' ');
    }
    
    // Fallback: use brand + basic type from tags
    const tagDesc = p.tags && p.tags.filter(t => t !== 'misc').map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' & ');
    if (tagDesc) return (brand && !isMostlyAmharic(brand) ? brand + ' ' : '') + tagDesc + ' Perfume';
    return (brand && !isMostlyAmharic(brand) ? brand : 'Dagu') + ' Fragrance #' + String(p.no).padStart(3, '0');
  }
  return name;
}

function getCleanBrand(p) {
  const brand = p.brand || '';
  const vibe = p.vibe || '';
  if (isMostlyAmharic(brand)) {
    // Try to find brand name from vibe
    const knownBrands = ['Lattafa', 'Rasasi', 'Afnan', 'Dior', 'Chanel', 'Versace', 'Tom Ford', 'Armani', 'YSL', 'Creed', 'Maison Margiela', 'Paco Rabanne', 'Hugo Boss', 'Calvin Klein', 'Gucci', 'Burberry', 'Kilian', 'Initio', 'Maahir', 'Shaik', 'Mousuf', 'Khamrah', 'Now Rave', 'Tobacco', 'His Confession'];
    for (const b of knownBrands) {
      if (vibe.toLowerCase().includes(b.toLowerCase())) return b;
    }
    return 'Exclusive';
  }
  return brand;
}

// ALL data moved to master-data.js
// Logic follows...

// ── RENDER ──────────────────────────────────────────────────────
let currentFilters = {
  category: [],
  type: [],
  scent: [],
  price: []
};
let searchQ = '';
let quizResults = null; 
let currentQuizFilter = null; 
let quizSliderIndex = 0;
let quizSliderItems = [];
let wishlist = JSON.parse(localStorage.getItem('dagu_wishlist')) || [];
let cart = JSON.parse(localStorage.getItem('dagu_cart')) || [];

function gBadge(g){
  if(g==='m')return'<span class="badge badge-m">Men</span>';
  if(g==='w')return'<span class="badge badge-w">Women</span>';
  return'<span class="badge badge-u">Unisex</span>';
}

function getBottleEmoji(p){
  const t=p.tags,g=p.g;
  if(t.includes('oud'))return'🕌';
  if(t.includes('gourmand'))return'🍫';
  if(t.includes('floral')&&g==='w')return'🌸';
  if(t.includes('aquatic'))return'🌊';
  if(t.includes('leather'))return'🪶';
  if(t.includes('woody'))return'🪵';
  if(t.includes('sweet'))return'🍯';
  if(t.includes('fruity'))return'🍑';
  if(t.includes('spicy'))return'🌶️';
  if(g==='m')return'🏺';
  if(g==='w')return'🌺';
  return'🫧';
}

function buildCard(p,delay){
  const isFav = wishlist.includes(p.no);
  const emoji = getBottleEmoji(p);
  const secColor = SEC_COLORS[p.sec] || 'rgba(110,19,36,.15)';
  
  // Use clean English name/brand
  const cleanName = getCleanName(p);
  const cleanBrand = getCleanBrand(p);
  
  let nameHtml = cleanName;
  if (searchQ) {
    const reg = new RegExp(`(${searchQ.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi');
    nameHtml = cleanName.replace(reg, '<span class="shigh">$1</span>');
  }

  const showImage = p.image && p.image !== '';
  const bgStyle = showImage 
    ? `background:url('${p.image}') center/cover no-repeat` 
    : `background:linear-gradient(135deg,${secColor},rgba(10,2,5,.88))`;

  return `
    <div class="pcard reveal" style="animation-delay:${delay}ms" onclick="openPanel(${p.no})">
      <div class="pcard-img" style="${bgStyle}">
        ${!showImage ? `<div class="pcard-bottle">${emoji}</div>` : ''}
        <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleWishlist(${p.no}, event)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.84-8.84 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
        <div class="pcard-hover-hint">View Details →</div>
      </div>
      <div class="pcard-info">
        <div class="pcard-id">ID · ${String(p.no).padStart(3, '0')}</div>
        <div class="pcard-brand">${cleanBrand}</div>
        <div class="pcard-name">${nameHtml}</div>
        <div class="pcard-badges">
          ${gBadge(p.g)}
          <span class="badge badge-size">${p.size}</span>
          ${p.orig ? '<span class="badge badge-orig">Original</span>' : '<span class="badge badge-clone">Clone</span>'}
          ${p.tags.filter(t => t !== 'misc').slice(0, 2).map(t => `<span class="badge badge-type">${t.charAt(0).toUpperCase() + t.slice(1)}</span>`).join('')}
        </div>
        ${p.price === 'N/A' ? '<div class="pcard-price-na">Price on request</div>' : `<div class="pcard-price">${p.price} Br</div>`}
      </div>
    </div>
  `;
}

function toggleWishlist(no, event) {
  event.stopPropagation();
  const idx = wishlist.indexOf(no);
  if (idx > -1) {
    wishlist.splice(idx, 1);
  } else {
    wishlist.push(no);
  }
  localStorage.setItem('dagu_wishlist', JSON.stringify(wishlist));
  render();
}

function render(){
  const c=document.getElementById('content');
  c.innerHTML='';
  
  SECTIONS.forEach(sec=>{
    let items=sortByPopularity(ALL.filter(p=>p.sec===sec.id), sec.id);

    // Quiz Filter (takes precedence or narrows)
    if (currentQuizFilter) {
      items = items.filter(p => currentQuizFilter.includes(p.no));
    }

    if (searchQ) items = items.filter(p =>
      p.name.toLowerCase().includes(searchQ) ||
      p.brand.toLowerCase().includes(searchQ) ||
      getCleanName(p).toLowerCase().includes(searchQ) ||
      getCleanBrand(p).toLowerCase().includes(searchQ) ||
      p.vibe.toLowerCase().includes(searchQ) ||
      p.tags.join(' ').includes(searchQ)
    );

    // Advanced Multi-select Filtering
    const { category, type, scent, price } = currentFilters;

    if (category.length) {
      items = items.filter(p => {
        if (category.includes('men') && p.g === 'm') return true;
        if (category.includes('women') && p.g === 'w') return true;
        if (category.includes('unisex') && p.g === 'u') return true;
        return false;
      });
    }

    if (type.length) {
      items = items.filter(p => {
        if (type.includes('designer') && p.orig) return true;
        if (type.includes('clone') && !p.orig) return true;
        return false;
      });
    }

    if (scent.length) {
      items = items.filter(p => {
        return scent.some(s => {
          if (s === 'fresh') return p.tags.includes('fresh') || p.tags.includes('aquatic');
          if (s === 'sweet') return p.tags.includes('sweet') || p.tags.includes('gourmand');
          if (s === 'woody') return p.tags.includes('woody') || p.tags.includes('leather');
          return p.tags.includes(s);
        });
      });
    }

    if (price.length) {
      items = items.filter(p => {
        const n = parseFloat(p.price.replace(/[^0-9]/g, ''));
        if (isNaN(n)) return false;
        return price.some(pr => {
          if (pr === 'budget') return n < 5000;
          if (pr === 'above5k') return n >= 5000;
          if (pr === 'above10k') return n >= 10000;
          return false;
        });
      });
    }
    if(!items.length) return;
    const el=document.createElement('div');
    el.className='cat-sec';
    el.id=sec.id;
    el.innerHTML=`
      <div class="sec-head" data-emoji="${sec.emoji}">
        <div class="sh-left">
          <div class="sh-tag">${sec.tag}</div>
          <div class="sh-title">${sec.emoji} ${sec.title}</div>
          <div class="sh-sub">${sec.sub}</div>
        </div>
        <div class="sh-right">
          <div class="sh-count">${items.length}</div>
          <div class="sh-count-l">Fragrances</div>
        </div>
      </div>
      <div class="p-grid">${items.map((p, i) => buildCard(p, i * 20)).join('')}</div>`;
    c.appendChild(el);
  });
  
  updateSidebarCounts();

  // ── RESULT BACKFILLING ──
  const totalItems = document.querySelectorAll('.pcard').length;
  if (totalItems > 0 && totalItems < 20) {
    const shownIds = Array.from(document.querySelectorAll('.pcard')).map(pc => {
      const oc = pc.getAttribute('onclick') || '';
      return parseInt(oc.match(/\d+/)[0]);
    });

    // Find "related" items NOT already shown
    let others = ALL.filter(p => !shownIds.includes(p.no));

    // Simple relevance: match gender if one is selected, otherwise just popular ones
    if (currentFilters.category.length) {
      const g = currentFilters.category[0] === 'men' ? 'm' : (currentFilters.category[0] === 'women' ? 'w' : 'u');
      others = others.sort((a, b) => (a.g === g ? -1 : 1));
    }

    const backfillCount = 20 - totalItems;
    const backfillItems = others.slice(0, backfillCount);

    if (backfillItems.length) {
      const el = document.createElement('div');
      el.className = 'cat-sec';
      el.innerHTML = `
        <div class="sec-head" data-emoji="✨">
          <div class="sh-left">
            <div class="sh-tag">More Recommendations</div>
            <div class="sh-title">✨ Recommended for You</div>
            <div class="sh-sub">We noticed you have a refined taste. Since we have a massive collection, here are some other incredible scents you might love.</div>
          </div>
        </div>
        <div class="p-grid">${backfillItems.map((p, i) => buildCard(p, i * 20)).join('')}</div>`;
      c.appendChild(el);
    }
  }

  document.querySelectorAll('.snav-item').forEach(it => {
    const oc=it.getAttribute('onclick')||'';
    const m=oc.match(/'([^']+)'/);
    if(m) it.classList.toggle('active',!!document.getElementById(m[1]));
  });
  revealObserver();
}

function updateSidebarCounts() {
  // Static sidebar now, but we update the total count in stats
  const statN = document.querySelector('.stat-n');
  if (statN) statN.textContent = ALL.length;
}

// ── DETAIL PANEL ────────────────────────────────────────────────
function openPanel(no){
  const p=ALL.find(x=>x.no===no);if(!p)return;
  currentPanelProduct = p; // Store for Cart engine
  const emoji=getBottleEmoji(p);
  const secColor=SEC_COLORS[p.sec]||'rgba(110,19,36,.25)';
  const showImage = p.image && p.image !== '';
  const dName = getCleanName(p);
  const dBrand = getCleanBrand(p);

  const imgEl = document.getElementById('dpImg');
  const bottleEl = document.getElementById('dpBottle');
  
  if (showImage) {
    imgEl.style.background = `linear-gradient(135deg,rgba(110,19,36,.2),rgba(10,2,5,.98))`;
    bottleEl.style.backgroundImage = `url('${p.image}')`;
    bottleEl.style.backgroundSize = 'contain';
    bottleEl.style.backgroundRepeat = 'no-repeat';
    bottleEl.style.backgroundPosition = 'center';
    bottleEl.style.display = 'block';
    bottleEl.textContent = '';
  } else {
    imgEl.style.background = `linear-gradient(135deg,${secColor},rgba(10,2,5,.9))`;
    bottleEl.style.backgroundImage = 'none';
    bottleEl.style.display = 'flex';
    bottleEl.textContent = emoji;
  }
  document.getElementById('dpNo').textContent=`#${String(p.no).padStart(3,'0')}`;
  document.getElementById('dpBrand').textContent=dBrand;
  document.getElementById('dpName').textContent=dName;
  // Show English vibe only
  const vibeText = p.vibe || '';
  const englishVibe = vibeText.replace(/[\u1200-\u137f\u1380-\u139f\u2D80-\u2DDF\uAB01-\uAB2E\ud800-\udbff\udc00-\udfff]/g, '').replace(/\s+/g, ' ').trim();
  document.getElementById('dpVibe').textContent = englishVibe || dName;
  document.getElementById('dpPrice').textContent=p.price==='N/A'?'—':p.price+' Br';
  document.getElementById('dpPrice').className=p.price==='N/A'?'dp-price-na':'dp-price-val';
  document.getElementById('dpSizeBadge').innerHTML=`<span class="badge badge-size" style="font-size:10px;padding:5px 10px">${p.size}</span>`;
  document.getElementById('dpBadges').innerHTML=
    gBadge(p.g)+
    (p.orig?'<span class="badge badge-orig" style="font-size:8px;padding:3px 8px">Original</span>':'<span class="badge badge-clone" style="font-size:8px;padding:3px 8px">Clone / Alt</span>')+
    p.tags.filter(t=>t!=='misc').slice(0,3).map(t=>`<span class="badge" style="font-size:7px;padding:2px 7px;background:rgba(110,19,36,.15);border:1px solid rgba(110,19,36,.3);color:rgba(245,237,224,.5)">${t}</span>`).join('');
  document.getElementById('detailPanel').classList.add('open');
  document.getElementById('dpBackdrop').classList.add('open');
  document.body.style.overflow='';
}
function closePanel(){
  document.getElementById('detailPanel').classList.remove('open');
  document.getElementById('dpBackdrop').classList.remove('open');
}

// ── FILTER / SEARCH ─────────────────────────────────────────────
// ── FILTER PANEL LOGIC ──
function openFilterPanel() {
  document.getElementById('filterPanel').classList.add('open');
  document.getElementById('filterBackdrop').classList.add('open');
  // Sync checkboxes with current state
  const inputs = document.querySelectorAll('#filterPanel input[type="checkbox"]');
  inputs.forEach(input => {
    const group = input.dataset.group;
    input.checked = currentFilters[group].includes(input.value);
  });
}

function closeFilterPanel() {
  document.getElementById('filterPanel').classList.remove('open');
  document.getElementById('filterBackdrop').classList.remove('open');
}

function syncFilters() {
  const inputs = document.querySelectorAll('#filterPanel input[type="checkbox"]');
  const newFilters = { category: [], type: [], scent: [], price: [] };
  inputs.forEach(input => {
    if (input.checked) {
      newFilters[input.dataset.group].push(input.value);
    }
  });
  currentFilters = newFilters;
  updateFilterUIState();
}

function applyFilters() {
  closeFilterPanel();
  render();
}

function clearAllFilters() {
  currentFilters = { category: [], type: [], scent: [], price: [] };
  currentQuizFilter = null; // Clear quiz
  const inputs = document.querySelectorAll('#filterPanel input[type="checkbox"]');
  inputs.forEach(input => input.checked = false);
  updateFilterUIState();
  render();
}

function updateFilterUIState() {
  // Update badges on "Filter" button
  let count = Object.values(currentFilters).flat().length;
  if (currentQuizFilter) count++; 

  const badge = document.getElementById('filterActiveCount');
  if (count > 0) {
    badge.textContent = count;
    badge.style.display = 'inline-block';
  } else {
    badge.style.display = 'none';
  }

  // Update sidebar highlights
  document.querySelectorAll('.snav-item').forEach(it => {
    const oc = it.getAttribute('onclick') || '';
    const match = oc.match(/'([^']+)'/);
    if (!match) return;
    const val = match[1];

    if (val === 'all') {
      it.classList.toggle('active', count === 0 && !currentQuizFilter);
    } else if (['men', 'women', 'unisex'].includes(val)) {
      it.classList.toggle('active', currentFilters.category.includes(val));
    }
  });
}

function setQuickFilter(f, btn) {
  currentQuizFilter = null; // Typing/Selecting a quick filter clears quiz results
  // Close sidebar on mobile
  closeSidebar();
  if (f === 'all') {
    currentFilters = { category: [], type: [], scent: [], price: [] };
  } else if (['men', 'women', 'unisex'].includes(f)) {
    currentFilters.category = [f];
  } else if (f === 'designer') {
    currentFilters.type = ['designer'];
  } else if (f === 'clone') {
    currentFilters.type = ['clone'];
  }
  updateFilterUIState();
  render();
  
  // Auto-scroll to the first rendered section
  setTimeout(() => {
    const firstSec = document.querySelector('.cat-sec');
    if (firstSec) {
      const headerH = document.getElementById('mainHeader')?.offsetHeight || 72;
      const top = firstSec.getBoundingClientRect().top + window.scrollY - headerH - 16;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, 60);
}

function setFilter(f, btn) {
  // Legacy support or fallback
  setQuickFilter(f, btn);
}

// ── SCENT QUIZ LOGIC ──
const QUIZ_DATA = [
  {
    q: "Who are we finding a scent for?",
    options: [
      { label: "👑 For Kings", emoji: "👑", score: { category: ['men', 'unisex'] } },
      { label: "🌹 For Queens", emoji: "🌹", score: { category: ['women', 'unisex'] } }
    ]
  },
  {
    q: "How would you describe your perfect vibe?",
    options: [
      { label: "Fresh & Energetic", emoji: "🌊", score: { scent: ['fresh', 'aquatic'] } },
      { label: "Bold & Commanding", emoji: "👑", score: { category: ['men'], scent: ['oud', 'woody'] } },
      { label: "Sweet & Addictive", emoji: "🍯", score: { scent: ['sweet', 'gourmand'] } },
      { label: "Elegant & Sophisticated", emoji: "🌹", score: { category: ['women'], scent: ['floral'] } }
    ]
  },
  {
    q: "What's the occasion for this scent?",
    options: [
      { label: "Daily Office / Casual", emoji: "💼", score: { scent: ['fresh'] } },
      { label: "Special Night Out", emoji: "🌙", score: { scent: ['sweet', 'oud', 'woody'] } },
      { label: "Gym / Outdoor", emoji: "🏃", score: { scent: ['fresh', 'aquatic'] } },
      { label: "Romantic Date", emoji: "🕯️", score: { scent: ['floral', 'sweet'] } }
    ]
  },
  {
    q: "Preferred intensity level?",
    options: [
      { label: "Light & Airy", emoji: "🌬️", score: { price: ['budget'] } },
      { label: "Powerful Beast Mode", emoji: "🔥", score: { type: ['designer'] } },
      { label: "Middle Eastern Richness", emoji: "🕌", score: { scent: ['oud'] } },
      { label: "Balanced & Smooth", emoji: "⚖️", score: {} }
    ]
  }
];

let quizStep = 0;
let quizAnswers = [];

function openQuiz() {
  quizStep = 0;
  quizAnswers = [];
  document.getElementById('quizModal').classList.add('open');
  document.getElementById('quizBackdrop').classList.add('open');
  document.getElementById('quizNextBtn').onclick = nextQuizStep; // Reset handler
  renderQuizStep();
}

function closeQuiz() {
  document.getElementById('quizModal').classList.remove('open');
  document.getElementById('quizBackdrop').classList.remove('open');
}

function renderQuizStep() {
  const body = document.getElementById('quizBody');
  const step = QUIZ_DATA[quizStep];
  const progress = ((quizStep) / QUIZ_DATA.length) * 100;
  document.getElementById('quizProgress').style.width = progress + '%';
  document.getElementById('quizBackBtn').style.display = quizStep > 0 ? 'block' : 'none';
  document.getElementById('quizNextBtn').textContent = quizStep === QUIZ_DATA.length - 1 ? 'See Results' : 'Next Question';
  document.getElementById('quizNextBtn').disabled = !quizAnswers[quizStep];

  body.innerHTML = `
    <div class="quiz-step">
      <div class="qs-question">${step.q}</div>
      <div class="qs-options">
        ${step.options.map((opt, i) => `
          <label class="qs-opt">
            <input type="radio" name="quiz_opt" value="${i}" ${quizAnswers[quizStep] == i ? 'checked' : ''} onchange="selectQuizOpt(${i})">
            <span>
              <div class="qs-opt-icon">${opt.emoji}</div>
              <div class="qs-opt-label">${opt.label}</div>
            </span>
          </label>
        `).join('')}
      </div>
    </div>
  `;
}

function selectQuizOpt(idx) {
  quizAnswers[quizStep] = idx;
  document.getElementById('quizNextBtn').disabled = false;
}

function nextQuizStep() {
  if (quizStep < QUIZ_DATA.length - 1) {
    quizStep++;
    renderQuizStep();
  } else {
    showQuizResults();
  }
}

function prevQuizStep() {
  if (quizStep > 0) {
    quizStep--;
    renderQuizStep();
  }
}

function showQuizResults() {
  document.getElementById('quizProgress').style.width = '100%';
  const body = document.getElementById('quizBody');
  const footer = document.getElementById('quizFooter');
  
  // Scoring
  const finalScore = { category: [], type: [], scent: [], price: [] };
  quizAnswers.forEach((ansIdx, stepIdx) => {
    const scores = QUIZ_DATA[stepIdx].options[ansIdx].score;
    for (let key in scores) {
      finalScore[key] = [...new Set([...finalScore[key], ...scores[key]])];
    }
  });

  // Find matches
  let matches = ALL.filter(p => {
    let matchCount = 0;
    if (finalScore.category.length && finalScore.category.includes('men') && p.g === 'm') matchCount++;
    if (finalScore.category.length && finalScore.category.includes('women') && p.g === 'w') matchCount++;
    if (finalScore.category.length && finalScore.category.includes('unisex') && p.g === 'u') matchCount++;
    if (finalScore.scent.length && finalScore.scent.some(s => p.tags.includes(s))) matchCount++;
    if (finalScore.type.length && finalScore.type.includes('designer') && p.orig) matchCount++;
    if (finalScore.type.length && finalScore.type.includes('clone') && !p.orig) matchCount++;
    return matchCount > 0;
  });

  // Sort by match quality (simple heuristic)
  matches.sort((a,b) => {
    let sa = 0, sb = 0;
    if (finalScore.scent.some(s => a.tags.includes(s))) sa++;
    if (finalScore.scent.some(s => b.tags.includes(s))) sb++;
    return sb - sa;
  });

  // Bridge if < 15
  if (matches.length < 15) {
    const matchedIds = matches.map(m => m.no);
    const others = ALL.filter(p => !matchedIds.includes(p.no));
    // Sort others by gender match
    const g = finalScore.category[0] === 'men' ? 'm' : (finalScore.category[0] === 'women' ? 'w' : 'u');
    others.sort((a,b) => (a.g === g ? -1 : 1));
    matches = [...matches, ...others.slice(0, 15 - matches.length)];
  }

  const finalItems = matches.slice(0, 20); // Show up to 20
  currentQuizFilter = finalItems.map(m => m.no);
  quizSliderItems = finalItems;
  quizSliderIndex = 0;

  closeQuiz();
  openQuizResultPanel();
}

function openQuizResultPanel() {
  document.getElementById('quizResultPanel').classList.add('open');
  document.getElementById('qrpBackdrop').style.opacity = '1';
  document.getElementById('qrpBackdrop').style.pointerEvents = 'all';
  renderQuizSlider();
}

function closeQuizResultPanel() {
  document.getElementById('quizResultPanel').classList.remove('open');
  document.getElementById('qrpBackdrop').style.opacity = '0';
  document.getElementById('qrpBackdrop').style.pointerEvents = 'none';
}

function renderQuizSlider() {
  const slider = document.getElementById('qrpSlider');
  const nextBtn = document.getElementById('qrpNext');
  const prevBtn = document.getElementById('qrpPrev');
  const applyBtn = document.getElementById('qrpApplyBtn');

  slider.innerHTML = quizSliderItems.map(p => `
    <div class="qrp-slide">
      <div class="qrp-img">${p.image ? `<img src="${p.image}" alt="${p.name}">` : getBottleEmoji(p)}</div>
      <div class="qrp-brand">${p.brand}</div>
      <div class="qrp-name">${p.name}</div>
      <div class="qrp-desc">${p.vibe}</div>
      <div class="qrp-price">${p.price} Br</div>
      
      <button class="qrp-view-product" onclick="closeQuizResultPanel(); openPanel(${p.no})">View Full Details →</button>
    </div>
  `).join('');

  updateSliderPos();

  applyBtn.textContent = `Explore All ${quizSliderItems.length} Recommendations →`;
  applyBtn.onclick = () => {
    render();
    closeQuizResultPanel();
    document.getElementById('footer')?.scrollIntoView({ behavior: 'smooth' }); // Just kidding, scroll to top
    window.scrollTo({ top: document.querySelector('.filters-bar').offsetTop - 20, behavior: 'smooth' });
    updateFilterUIState();
  };
}

function moveQuizSlider(dir) {
  quizSliderIndex += dir;
  if (quizSliderIndex < 0) quizSliderIndex = 0;
  if (quizSliderIndex >= quizSliderItems.length) quizSliderIndex = quizSliderItems.length - 1;
  updateSliderPos();
}

function updateSliderPos() {
  const slider = document.getElementById('qrpSlider');
  const nextBtn = document.getElementById('qrpNext');
  const prevBtn = document.getElementById('qrpPrev');
  
  slider.style.transform = `translateX(-${quizSliderIndex * 100}%)`;
  
  prevBtn.disabled = quizSliderIndex === 0;
  nextBtn.disabled = quizSliderIndex === quizSliderItems.length - 1;
}
function doSearch(){
  searchQ=document.getElementById('searchInput').value.toLowerCase().trim();
  render();
}
function goTo(id){
  const el=document.getElementById(id);
  if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
}

// ── SIDEBAR POPUP ────────────────────────────────────────────────
function openSidebar() {
  document.getElementById('sideNav').classList.add('open');
  document.getElementById('sideBackdrop').classList.add('open');
  document.getElementById('sideArrow').classList.add('open');
}
function closeSidebar() {
  document.getElementById('sideNav').classList.remove('open');
  document.getElementById('sideBackdrop').classList.remove('open');
  document.getElementById('sideArrow').classList.remove('open');
}
function toggleSidebar() {
  const nav = document.getElementById('sideNav');
  if (nav.classList.contains('open')) {
    closeSidebar();
  } else {
    openSidebar();
  }
}

// ── REVEAL ──────────────────────────────────────────────────────
const ro=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('vis');});
},{threshold:.1});
function revealObserver(){
  document.querySelectorAll('.reveal').forEach(el=>ro.observe(el));
}
revealObserver();

// ── SCROLL SPY ──────────────────────────────────────────────────
const secObs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      const id=e.target.id;
      document.querySelectorAll('.snav-item').forEach(it=>{
        const oc=it.getAttribute('onclick')||'';
        it.classList.toggle('active',oc.includes(`'${id}'`));
      });
    }
  });
},{threshold:.2,rootMargin:'-80px 0px 0px 0px'});

// ── FIREBASE PRODUCT SYNC ───────────────────────────────────────
async function initStore() {
  if (typeof db !== 'undefined' && db) {
    try {
      const snap = await db.collection("products").get();
      snap.forEach(doc => {
        const data = doc.data();
        const existingIdx = ALL.findIndex(p => p.no === data.no);
        if (data.deleted) {
          if (existingIdx >= 0) ALL.splice(existingIdx, 1);
        } else if (existingIdx >= 0) {
          ALL[existingIdx] = { ...ALL[existingIdx], ...data };
        } else {
          ALL.push(data);
        }
      });
    } catch(e) { console.warn("Could not load dynamic products", e); }
  }
  render();
  updateCartCount();
  setTimeout(()=>{
    document.querySelectorAll('.cat-sec').forEach(s=>secObs.observe(s));
  },200);
}

initStore();

// ════════════════════════════════════════════
//  CART ENGINE
// ════════════════════════════════════════════
let currentPanelProduct = null;

function openCart() {
  document.getElementById('cartPanel').classList.add('open');
  document.getElementById('cartBackdrop').classList.add('open');
  renderCart();
}
function closeCart() {
  document.getElementById('cartPanel').classList.remove('open');
  document.getElementById('cartBackdrop').classList.remove('open');
}

function addToCartFromPanel() {
  if (!currentPanelProduct) return;
  const p = currentPanelProduct;
  if (p.price === 'N/A') { alert('Price not available. Please call us to order.'); return; }

  const existing = cart.find(i => i.no === p.no);
  if (existing) {
    existing.qty++;
  } else {
    const priceNum = parseFloat(p.price.replace(/[^0-9.]/g, '')) || 0;
    cart.push({ no: p.no, brand: p.brand, name: p.name, price: priceNum, priceStr: p.price, size: p.size, emoji: getBottleEmoji(p), qty: 1 });
  }

  localStorage.setItem('dagu_cart', JSON.stringify(cart));
  updateCartCount();
  flashCartBtn();
  showAddedState();
}

function quickAddToCart(no, event) {
  event.stopPropagation();
  const p = ALL.find(x => x.no === no);
  if (!p || p.price === 'N/A') return;
  const existing = cart.find(i => i.no === no);
  if (existing) { existing.qty++; } else {
    const priceNum = parseFloat(p.price.replace(/[^0-9.]/g, '')) || 0;
    cart.push({ no: p.no, brand: p.brand, name: p.name, price: priceNum, priceStr: p.price, size: p.size, emoji: getBottleEmoji(p), qty: 1 });
  }
  updateCartCount();
  flashCartBtn();
}

function showAddedState() {
  const btn = document.getElementById('dpAddCartBtn');
  btn.classList.add('added');
  btn.innerHTML = '✓ Added to Cart';
  setTimeout(() => {
    btn.classList.remove('added');
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> Add to Cart`;
  }, 1800);
}

function flashCartBtn() {
  const cnt = document.getElementById('cartCount');
  cnt.classList.add('bump');
  setTimeout(() => cnt.classList.remove('bump'), 300);
}

function updateCartCount() {
  const total = cart.reduce((s, i) => s + i.qty, 0);
  document.getElementById('cartCount').textContent = total;
}

function cartTotal() {
  return cart.reduce((s, i) => s + i.price * i.qty, 0);
}

function formatPrice(n) {
  return n.toLocaleString('en-ET') + ' Br';
}

// ── FAVORITES (WISHLIST) ────────────────────────────────────────
function toggleWishlist(no, event) {
  if (event) event.stopPropagation();
  const idx = wishlist.indexOf(no);
  if (idx >= 0) {
    wishlist.splice(idx, 1);
  } else {
    wishlist.push(no);
  }
  localStorage.setItem('dagu_wishlist', JSON.stringify(wishlist));
  
  if (event && event.currentTarget) {
    event.currentTarget.classList.toggle('active', wishlist.includes(no));
    const svg = event.currentTarget.querySelector('svg');
    if (svg) svg.setAttribute('fill', wishlist.includes(no) ? 'currentColor' : 'none');
  }
  updateFavCount();
  renderFavs();
}

function updateFavCount() {
  const cnt = document.getElementById('favCount');
  if (cnt) cnt.textContent = wishlist.length;
  const fDisplay = document.getElementById('favCountDisplay');
  if (fDisplay) fDisplay.textContent = `(${wishlist.length})`;
}

function openFavs() {
  renderFavs();
  document.getElementById('favBackdrop').classList.add('open');
  document.getElementById('favPanel').classList.add('open');
}

function closeFavs() {
  document.getElementById('favBackdrop').classList.remove('open');
  document.getElementById('favPanel').classList.remove('open');
}

function renderFavs() {
  const el = document.getElementById('favBody');
  if (!el) return;
  if (wishlist.length === 0) {
    el.innerHTML = '<div class="cart-empty">No favorites yet. Tap the heart on products you love!</div>';
    return;
  }
  
  const favItems = wishlist.map(no => ALL.find(p => p.no === no)).filter(Boolean);
  
  el.innerHTML = favItems.map(item => `
    <div class="cart-item" style="cursor: pointer" onclick="closeFavs(); openPanel(${item.no})">
      <div class="cart-item-emoji">${item.image ? `<img src="${item.image}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;">` : getBottleEmoji(item)}</div>
      <div class="cart-item-info">
        <div class="cart-item-brand">${item.brand}</div>
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${item.price > 0 ? formatPrice(item.price) : 'Price on request'}</div>
      </div>
      <div class="cart-item-right">
        <button class="cart-item-remove" onclick="toggleWishlist(${item.no}, event)" style="color:var(--brand); border:1px solid rgba(110,19,36,0.3); padding:4px 8px; border-radius:4px; font-size:12px;">Remove</button>
      </div>
    </div>`).join('');
}

window.addEventListener('load', updateFavCount);


// ── CART ────────────────────────────────────────────────────────
function renderCart() {
  const el = document.getElementById('cartItems');
  const footer = document.getElementById('cartFooter');
  const empty = document.getElementById('cartEmpty');
  const headerCount = document.getElementById('cartHeaderCount');

  const total = cart.reduce((s, i) => s + i.qty, 0);
  headerCount.textContent = total > 0 ? `(${total})` : '';

  if (cart.length === 0) {
    el.innerHTML = '';
    el.appendChild(empty);
    empty.style.display = 'flex';
    footer.style.display = 'none';
    return;
  }
  empty.style.display = 'none';
  footer.style.display = 'block';

  el.innerHTML = cart.map(item => `
    <div class="cart-item" id="ci-${item.no}">
      <div class="cart-item-emoji">${item.emoji}</div>
      <div class="cart-item-info">
        <div class="cart-item-brand">${item.brand}</div>
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${item.price > 0 ? formatPrice(item.price) : 'Price on request'}</div>
      </div>
      <div class="cart-item-right">
        <div class="cart-item-qty">
          <button class="cart-qty-btn" onclick="changeQty(${item.no},-1)">−</button>
          <span class="cart-qty-num">${item.qty}</span>
          <button class="cart-qty-btn" onclick="changeQty(${item.no},1)">+</button>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart(${item.no})">remove</button>
      </div>
    </div>`).join('');

  document.getElementById('cartTotal').textContent = formatPrice(cartTotal());
}

function changeQty(no, delta) {
  const item = cart.find(i => i.no === no);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) { cart = cart.filter(i => i.no !== no); }
  localStorage.setItem('dagu_cart', JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

function removeFromCart(no) {
  cart = cart.filter(i => i.no !== no);
  localStorage.setItem('dagu_cart', JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

// ════════════════════════════════════════════
//  CHECKOUT FLOW
// ════════════════════════════════════════════
const PAYMENT_ACCOUNTS = {
  Telebirr: '0993 33 7235',
  CBE: '1000123456789'
};

let selectedPayment = '';

function openCheckout() {
  if (cart.length === 0) return;
  closeCart();

  const summaryEl = document.getElementById('coSummary');
  summaryEl.innerHTML = cart.map(i => `
    <div class="co-sum-item">
      <span class="co-sum-item-name">${i.emoji} ${i.brand} ${i.name}</span>
      <span class="co-sum-item-qty">×${i.qty}</span>
      <span class="co-sum-item-price">${i.price > 0 ? formatPrice(i.price * i.qty) : '—'}</span>
    </div>`).join('');

  document.getElementById('coTotal').innerHTML = `
    <span class="co-total-lbl">Order Total</span>
    <span class="co-total-val">${formatPrice(cartTotal())}</span>`;

  document.getElementById('coName').value = '';
  document.getElementById('coPhone').value = '';
  document.querySelectorAll('input[name="payMethod"]').forEach(r => r.checked = false);
  document.getElementById('coAccountInfo').style.display = 'none';
  document.getElementById('coErr1').textContent = '';
  document.getElementById('coErr2').textContent = '';
  document.getElementById('coTxId').value = '';
  selectedPayment = '';

  document.getElementById('coStep1').style.display = 'block';
  document.getElementById('coStep2').style.display = 'none';

  document.getElementById('checkoutBackdrop').classList.add('open');
  document.getElementById('checkoutModal').classList.add('open');
}

function closeCheckout() {
  document.getElementById('checkoutBackdrop').classList.remove('open');
  document.getElementById('checkoutModal').classList.remove('open');
}

function selectPayment(method) {
  selectedPayment = method;
  const info = document.getElementById('coAccountInfo');
  const num = document.getElementById('coAccountNum');
  num.textContent = PAYMENT_ACCOUNTS[method] || '';
  info.style.display = 'block';
}

function goToStep2() {
  const name = document.getElementById('coName').value.trim();
  const phone = document.getElementById('coPhone').value.trim();
  const err = document.getElementById('coErr1');

  if (!name) { err.textContent = '⚠ Please enter your full name.'; return; }
  if (!phone || phone.replace(/\D/g,'').length < 9) { err.textContent = '⚠ Please enter a valid phone number.'; return; }
  if (!selectedPayment) { err.textContent = '⚠ Please select a payment method.'; return; }
  err.textContent = '';

  document.getElementById('coRecap').innerHTML = `
    <strong>${name}</strong><br>
    📞 ${phone}<br>
    💳 ${selectedPayment} → <strong>${PAYMENT_ACCOUNTS[selectedPayment]}</strong><br>
    <br>
    Send <strong>${formatPrice(cartTotal())}</strong> to the account above, then paste the transaction ID below.`;

  document.getElementById('coStep1').style.display = 'none';
  document.getElementById('coStep2').style.display = 'block';
}

function goToStep1() {
  document.getElementById('coStep1').style.display = 'block';
  document.getElementById('coStep2').style.display = 'none';
}

async function submitOrder() {
  const txId = document.getElementById('coTxId').value.trim();
  const err = document.getElementById('coErr2');
  const btn = document.getElementById('coSubmitBtn');

  if (!txId) { err.textContent = '⚠ Please enter your transaction ID.'; return; }
  if (txId.length < 4) { err.textContent = '⚠ Transaction ID looks too short. Please check.'; return; }
  err.textContent = '';

  btn.disabled = true;
  btn.textContent = 'Placing order…';

  const name = document.getElementById('coName').value.trim();
  const phone = document.getElementById('coPhone').value.trim();
  const total = cartTotal();
  const orderData = {
    customerName: name,
    customerPhone: phone,
    paymentMethod: selectedPayment,
    transactionId: txId,
    totalAmount: total,
    items: cart.map(i => ({ no: i.no, name: i.name, brand: i.brand, qty: i.qty, price: i.price, size: i.size })),
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    if (!db || firebaseConfig.apiKey === "YOUR_API_KEY") {
      throw new Error("Firebase database not initialized. Please update firebaseConfig.");
    }
    
    // Add a new document to the "orders" collection
    const docRef = await db.collection("orders").add(orderData);
    
    closeCheckout();
    const ref = 'DGU-' + docRef.id.slice(-6).toUpperCase();
    showSuccess(ref, name);
    cart = [];
    updateCartCount();
    
    // Reset button
    btn.disabled = false;
    btn.textContent = 'Place Order 🎉';
  } catch (error) {
    console.error("Error adding order document: ", error);
    err.textContent = '⚠ Error placing order. Please make sure Firebase is properly configured.';
    
    // Reset button
    btn.disabled = false;
    btn.textContent = 'Place Order 🎉';
  }
}

function showSuccess(ref, name) {
  document.getElementById('succMsg').textContent =
    `Thank you, ${name}! Your order has been received. We'll confirm once your payment is verified.`;
  document.getElementById('succRef').textContent = `Order Reference: ${ref}`;
  document.getElementById('successBackdrop').classList.add('open');
  document.getElementById('successModal').classList.add('open');
}

function closeSuccess() {
  document.getElementById('successBackdrop').classList.remove('open');
  document.getElementById('successModal').classList.remove('open');
}

// ── Patch openPanel to track current product & reset add btn ──
const _origOpenPanel = openPanel;
openPanel = function(no) {
  _origOpenPanel(no);
  currentPanelProduct = ALL.find(x => x.no === no) || null;
  const btn = document.getElementById('dpAddCartBtn');
  if (btn) {
    btn.classList.remove('added');
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> Add to Cart`;
    if (currentPanelProduct && currentPanelProduct.price === 'N/A') {
      btn.style.opacity = '0.4';
      btn.title = 'Price on request — please call us';
    } else {
      btn.style.opacity = '1';
      btn.title = '';
    }
  }
};
