/* ══════════════════════════════════════════
   Pneumàtics SAM — script
══════════════════════════════════════════ */
const page = document.body.dataset.page;
const lang = document.documentElement.lang;
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

/* ─── Active menu item & current language ─── */
document.querySelectorAll('[data-nav]').forEach(a => {
  if (a.dataset.nav.split(' ').includes(page)) a.classList.add('active');
});
document.querySelectorAll('[data-lang]').forEach(a => {
  if (a.dataset.lang === lang) a.classList.add('current');
  // Remember the chosen language for the next visit
  a.addEventListener('click', () => { try { localStorage.setItem('lang', a.dataset.lang); } catch (e) {} });
});
try { localStorage.setItem('lang', lang); } catch (e) {}

/* ─── Language dropdown ─── */
const langSwitch = document.querySelector('.lang-switch');
if (langSwitch) {
  const btn = langSwitch.querySelector('.lang-btn');
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const open = langSwitch.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', () => { langSwitch.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); });
}

/* ─── Mobile menu ─── */
hamburger.addEventListener('click', () => {
  const open = !mobileMenu.classList.contains('open');
  hamburger.classList.toggle('open', open);
  mobileMenu.classList.toggle('open', open);
  navbar.classList.toggle('menu-open', open);
  hamburger.setAttribute('aria-expanded', String(open));
});

/* ─── Navbar background on scroll ─── */
function updateNav() { navbar.classList.toggle('solid', window.scrollY > 40); }
window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

/* ─── Hero slideshow ─── */
(function () {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-dots button');
  if (slides.length < 2) return;
  let i = 0, timer;
  function go(n) {
    slides[i].classList.remove('active'); dots[i]?.classList.remove('active');
    i = (n + slides.length) % slides.length;
    slides[i].classList.add('active'); dots[i]?.classList.add('active');
  }
  function start() { clearInterval(timer); timer = setInterval(() => go(i + 1), 6000); }
  dots.forEach((d, n) => d.addEventListener('click', () => { go(n); start(); }));
  start();
})();

/* ─── Gallery filter ─── */
document.querySelectorAll('.filter').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter').forEach(b => b.classList.toggle('active', b === btn));
    const f = btn.dataset.filter;
    document.querySelectorAll('.m-item').forEach(item => {
      item.classList.toggle('is-hidden', f !== 'tots' && item.dataset.cat !== f);
    });
  });
});

/* ─── Lightbox ─── */
(function () {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  const img = lb.querySelector('img');
  const cap = lb.querySelector('figcaption');
  let group = [], idx = 0;

  const imgOf = el => (el.tagName === 'IMG' ? el : el.querySelector('img'));
  function render() {
    const el = imgOf(group[idx]);
    img.src = el.currentSrc || el.src;
    img.alt = el.alt;
    const fc = group[idx].querySelector && group[idx].querySelector('figcaption');
    cap.textContent = fc ? fc.innerText.replace(/\s+/g, ' ') : el.alt;
  }
  function open(el) {
    group = [...document.querySelectorAll(`[data-lb="${el.dataset.lb}"]`)].filter(g => !g.classList.contains('is-hidden'));
    idx = Math.max(0, group.indexOf(el));
    render();
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    lb.querySelector('.lb-close').focus();
  }
  function close() { lb.hidden = true; document.body.style.overflow = ''; }
  function step(d) { idx = (idx + d + group.length) % group.length; render(); }

  document.addEventListener('click', e => { const el = e.target.closest('[data-lb]'); if (el) open(el); });
  lb.querySelector('.lb-close').addEventListener('click', close);
  lb.querySelector('.lb-prev').addEventListener('click', () => step(-1));
  lb.querySelector('.lb-next').addEventListener('click', () => step(1));
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  document.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
})();

/* ─── Open now / closed (reads the hours table, Andorra time) ─── */
(function () {
  const scopes = document.querySelectorAll('[data-hours-scope]');
  if (!scopes.length) return;
  // Current day and minutes in Andorra, whatever the visitor's timezone
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Andorra', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
  const get = t => parts.find(p => p.type === t).value;
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  const now = parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10);
  const toMin = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  const inDays = (spec, d) => spec.split(',').some(part => {
    const [a, b] = part.split('-').map(Number);
    return b === undefined ? d === a : d >= a && d <= b;
  });

  scopes.forEach(scope => {
    const status = scope.querySelector('.open-status');
    let open = false;
    scope.querySelectorAll('tr[data-days]').forEach(tr => {
      if (!inDays(tr.dataset.days, day)) return;
      tr.classList.add('today');
      (tr.dataset.open || '').split(',').filter(Boolean).forEach(range => {
        const [from, to] = range.split('-');
        if (now >= toMin(from) && now < toMin(to)) open = true;
      });
    });
    if (status) {
      status.textContent = open ? status.dataset.openText : status.dataset.closedText;
      status.classList.add(open ? 'is-open' : 'is-closed');
    }
  });
})();

/* ─── Google Maps only after the visitor asks for it (cookies) ─── */
document.querySelectorAll('.map[data-map]').forEach(map => {
  const btn = map.querySelector('.map-load');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    iframe.title = 'Google Maps';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.src = `https://www.google.com/maps?q=${map.dataset.map}&hl=${lang}&output=embed`;
    map.innerHTML = '';
    map.appendChild(iframe);
    map.classList.add('loaded');
  });
});

/* ─── Services page: highlight the section in view ─── */
(function () {
  const links = document.querySelectorAll('.svc-index a');
  if (!links.length || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      links.forEach(a => {
        const on = a.getAttribute('href') === '#' + en.target.id;
        a.classList.toggle('current', on);
        if (on) a.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('.svc-row[id]').forEach(s => io.observe(s));
})();

/* ─── Booking form ─── */
(function () {
  const form = document.querySelector('.book-form');
  if (!form) return;
  const error = form.querySelector('.form-error');

  // Pre-fill from the URL: contacte.html?servei=frens&taller=sam1&mida=205/55R16
  const params = new URLSearchParams(location.search);
  ['servei', 'taller', 'mida'].forEach(name => {
    const v = params.get(name), field = form.elements[name];
    if (!v || !field) return;
    if (field.tagName === 'SELECT' && ![...field.options].some(o => o.value === v)) return;
    field.value = v;
  });
  if (params.get('mida') && !params.get('servei')) form.elements.servei.value = 'pneumatics';
  // No dates in the past
  const date = form.elements.data;
  if (date) date.min = new Date().toISOString().slice(0, 10);

  // Each workshop has its own WhatsApp and email (see the <option data-*> in contacte.html).
  // Emails are delivered by FormSubmit to the selected workshop's address.
  const tallerSelect = form.elements.taller;
  const dest = () => tallerSelect.options[tallerSelect.selectedIndex].dataset;
  const fmtPhone = n => '+' + n.slice(0, 3) + ' ' + n.slice(3, 6) + ' ' + n.slice(6);
  form.elements._next.value = new URL('gracies.html', location.href).href;
  function updateDest() {
    const d = dest();
    form.action = `https://formsubmit.co/${d.mail}`;
    const name = form.querySelector('.dest-name'), detail = form.querySelector('.dest-detail');
    if (name) name.textContent = d.name;
    if (detail) detail.textContent = d.wa ? `WhatsApp ${fmtPhone(d.wa)} · ${d.mail}` : d.mail;
    // Workshops without WhatsApp (data-wa="") only get the email option
    form.querySelector('.wa-send').hidden = !d.wa;
  }
  tallerSelect.addEventListener('change', updateDest);

  function valid() {
    const ok = form.elements.nom.value.trim() && form.elements.telefon.value.trim() && form.elements.privacitat.checked;
    error.hidden = !!ok;
    return !!ok;
  }
  updateDest();
  form.addEventListener('submit', e => { updateDest(); if (!valid()) e.preventDefault(); });

  // WhatsApp: build a readable message with the label of each filled-in field
  form.querySelector('.wa-send').addEventListener('click', () => {
    if (!dest().wa || !valid()) return;
    const lines = [form.dataset.waIntro, ''];
    form.querySelectorAll('.field').forEach(f => {
      const input = f.querySelector('input:not([type=checkbox]), select, textarea');
      if (!input || !input.value.trim()) return;
      const label = f.querySelector('label').childNodes[0].textContent.replace('*', '').trim();
      const value = input.tagName === 'SELECT' ? input.options[input.selectedIndex].text : input.value.trim();
      lines.push(`• ${label}: ${value}`);
    });
    window.open(`https://wa.me/${dest().wa}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener');
  });
})();

/* ─── Reveal on scroll ─── */
(function () {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('visible')); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => io.observe(el));
})();

/* ─── Footer year ─── */
document.querySelectorAll('.year').forEach(el => { el.textContent = new Date().getFullYear(); });
