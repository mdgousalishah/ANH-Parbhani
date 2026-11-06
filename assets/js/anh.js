/* Ashoorkhana Naale Hyder & Masjid e Mehtab Ali Shah — shared site script */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
  };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var OFFICE_WA = '919421488111';

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- Theme ---------- */
  var root = document.documentElement;
  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    root.setAttribute('data-bs-theme', t);
    $$('[data-theme-toggle]').forEach(function (b) {
      var dark = t === 'dark';
      b.setAttribute('aria-pressed', String(dark));
      b.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
      var i = b.querySelector('i');
      if (i) i.className = dark ? 'fas fa-sun' : 'fas fa-moon';
    });
  }
  applyTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
  $$('[data-theme-toggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      store.set('theme', next);
      applyTheme(next);
    });
  });

  /* ---------- Navigation ---------- */
  var nav = $('.site-nav');
  var progress = $('#reading-progress');
  function onScroll() {
    if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 24);
    if (progress) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0) + '%';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var menu = $('#siteMenu');
  if (menu) {
    $$('a', menu).forEach(function (a) {
      a.addEventListener('click', function () {
        if (menu.classList.contains('show') && window.bootstrap) {
          window.bootstrap.Collapse.getOrCreateInstance(menu).hide();
        }
      });
    });
  }

  $$('[data-year]').forEach(function (e) { e.textContent = new Date().getFullYear(); });

  /* ---------- Counters (numbers are correct in HTML; animation is a bonus) ---------- */
  var counters = $$('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, target = parseInt(el.getAttribute('data-count'), 10), start = null;
        io.unobserve(el);
        function step(ts) {
          if (!start) start = ts;
          var p = Math.min(1, (ts - start) / 1200);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString('en-IN');
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (c) { io.observe(c); });
  }

  /* ---------- Copy to clipboard ---------- */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy') ? resolve() : reject(); } catch (e) { reject(e); }
      document.body.removeChild(ta);
    });
  }
  $$('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var src = document.getElementById(btn.getAttribute('data-copy'));
      var text = src ? src.textContent.trim() : window.location.href;
      var label = btn.querySelector('span');
      var original = label ? label.textContent : '';
      copyText(text).then(function () {
        btn.classList.add('is-done');
        if (label) label.textContent = 'Copied';
        setTimeout(function () { btn.classList.remove('is-done'); if (label) label.textContent = original; }, 2000);
      }).catch(function () {
        if (label) label.textContent = 'Press Ctrl+C';
      });
    });
  });

  /* ---------- Share links ---------- */
  $$('[data-share]').forEach(function (a) {
    var url = encodeURIComponent(window.location.href);
    var title = encodeURIComponent(document.title);
    var map = {
      wa: 'https://wa.me/?text=' + title + '%20' + url,
      fb: 'https://www.facebook.com/sharer/sharer.php?u=' + url,
      x: 'https://twitter.com/intent/tweet?text=' + title + '&url=' + url
    };
    var href = map[a.getAttribute('data-share')];
    if (href) a.setAttribute('href', href);
  });

  /* ---------- WhatsApp forms ----------
     The site is static (no server), so forms are delivered as a pre-filled
     WhatsApp message to the office. The visitor sees exactly what will be sent. */
  var waModalEl = $('#waModal');
  $$('form[data-wa-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var lines = ['*' + form.getAttribute('data-wa-form') + '*', ''];
      $$('[data-wa-label]', form).forEach(function (f) {
        var v = (f.value || '').trim();
        if (!v || (f.tagName === 'SELECT' && f.selectedIndex === 0 && f.options[0].disabled)) return;
        if (f.tagName === 'TEXTAREA') { lines.push('', '*' + f.getAttribute('data-wa-label') + ':*', v); }
        else { lines.push('*' + f.getAttribute('data-wa-label') + ':* ' + v); }
      });
      var text = lines.join('\n');
      var href = 'https://wa.me/' + OFFICE_WA + '?text=' + encodeURIComponent(text);

      if (!waModalEl || !window.bootstrap) { window.open(href, '_blank', 'noopener'); return; }
      $('#waPreview', waModalEl).innerHTML = '<div class="wa-bubble">' +
        escapeHtml(text).replace(/\*(.+?)\*/g, '<strong>$1</strong>') + '</div>';
      var send = $('#waSend', waModalEl);
      send.setAttribute('href', href);
      send.onclick = function () {
        var done = form.parentElement.querySelector('[data-wa-success]');
        setTimeout(function () {
          window.bootstrap.Modal.getOrCreateInstance(waModalEl).hide();
          if (done) { form.hidden = true; done.hidden = false; done.focus(); }
          form.reset();
        }, 150);
      };
      window.bootstrap.Modal.getOrCreateInstance(waModalEl).show();
    });
  });
  $$('[data-wa-reset]').forEach(function (b) {
    b.addEventListener('click', function () {
      var box = b.closest('[data-wa-success]');
      var form = box && box.parentElement.querySelector('form[data-wa-form]');
      if (form) { box.hidden = true; form.hidden = false; var f = form.querySelector('input,select,textarea'); if (f) f.focus(); }
    });
  });

  /* ---------- Prayer times (Parbhani, shown in India time) ---------- */
  var prayerBox = $('#prayer');
  if (prayerBox) {
    var ORDER = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    var FALLBACK = { Fajr: '05:30', Sunrise: '06:45', Dhuhr: '12:30', Asr: '16:00', Maghrib: '18:15', Isha: '19:45' };
    var timings = null;

    var ist = function () {
      var parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      }).formatToParts(new Date());
      var g = function (t) { var p = parts.filter(function (x) { return x.type === t; })[0]; return p ? parseInt(p.value, 10) : 0; };
      return { secs: (g('hour') % 24) * 3600 + g('minute') * 60 + g('second'), key: g('year') + '-' + g('month') + '-' + g('day') };
    };
    var toSecs = function (t) { var m = /(\d{1,2}):(\d{2})/.exec(t || ''); return m ? (+m[1]) * 3600 + (+m[2]) * 60 : null; };
    var fmt = function (t) {
      var s = toSecs(t); if (s === null) return '--:--';
      var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
      return ((h % 12) || 12) + ':' + (m < 10 ? '0' : '') + m + (h >= 12 ? ' pm' : ' am');
    };
    var todayLabel = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
    var dateEl = $('[data-prayer-date]', prayerBox);
    if (dateEl) dateEl.textContent = todayLabel;

    var render = function (t, hijri, live) {
      timings = t;
      ORDER.forEach(function (name) {
        var el = $('[data-prayer="' + name + '"] .prayer-time', prayerBox);
        if (el) el.textContent = fmt(t[name]);
      });
      var hj = $('[data-hijri]', prayerBox);
      if (hj) { hj.textContent = hijri || ''; hj.hidden = !hijri; }
      var note = $('[data-prayer-note]', prayerBox);
      if (note) note.hidden = !!live;
      tick();
    };

    var tick = function () {
      if (!timings) return;
      var now = ist().secs, next = null, nextAt = 0;
      ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].some(function (n) {
        var s = toSecs(timings[n]);
        if (s !== null && s > now) { next = n; nextAt = s; return true; }
        return false;
      });
      if (!next) { next = 'Fajr'; nextAt = (toSecs(timings.Fajr) || 0) + 86400; }
      var diff = Math.max(0, nextAt - now), h = Math.floor(diff / 3600), m = Math.ceil((diff % 3600) / 60);
      if (m === 60) { h += 1; m = 0; }
      $$('[data-prayer]', prayerBox).forEach(function (li) {
        var on = li.getAttribute('data-prayer') === next;
        li.classList.toggle('is-next', on);
        if (on) li.setAttribute('aria-current', 'time'); else li.removeAttribute('aria-current');
      });
      var label = $('[data-prayer-next]', prayerBox);
      if (label) label.innerHTML = 'Next: <b>' + next + '</b> in ' + (h ? h + ' h ' : '') + m + ' min';
    };

    var cached = null;
    try { cached = JSON.parse(store.get('anh-prayer') || 'null'); } catch (e) { cached = null; }
    if (cached && cached.key === ist().key && cached.t) {
      render(cached.t, cached.hijri, true);
    } else {
      render(FALLBACK, '', false);
      fetch('https://api.aladhan.com/v1/timingsByCity?city=Parbhani&country=India&method=2')
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (d) {
          var t = {};
          ORDER.forEach(function (n) { t[n] = d.data.timings[n]; });
          var h = d.data.date && d.data.date.hijri;
          var hijri = h ? h.day + ' ' + h.month.en + ' ' + h.year + ' AH' : '';
          store.set('anh-prayer', JSON.stringify({ key: ist().key, t: t, hijri: hijri }));
          render(t, hijri, true);
        })
        .catch(function () { /* keep fallback times and the visible note */ });
    }
    setInterval(tick, 15000);
  }

  /* ---------- Verse of the day (Friday gets Jumu'ah verse) ---------- */
  var verse = $('#reflection');
  if (verse) {
    var weekday = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', weekday: 'long' }).format(new Date());
    if (weekday === 'Friday') {
      $('[data-v-title]', verse).textContent = "Today is Jumu'ah";
      $('[data-v-intro]', verse).textContent = 'The Prophet (peace be upon him) said, "The best day on which the sun has risen is Friday."';
      $('[data-v-ar]', verse).textContent = 'يَا أَيُّهَا الَّذِينَ آمَنُوا إِذَا نُودِيَ لِلصَّلَاةِ مِن يَوْمِ الْجُمُعَةِ فَاسْعَوْا إِلَىٰ ذِكْرِ اللَّهِ';
      $('[data-v-en]', verse).textContent = '"O you who have believed, when the call is made for prayer on the day of Jumu\'ah, then proceed to the remembrance of Allah."';
      $('[data-v-ref]', verse).textContent = 'Quran 62:9';
    }
  }

  /* ---------- News filters ---------- */
  var filterBtns = $$('[data-filter]');
  if (filterBtns.length) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var f = btn.getAttribute('data-filter');
        filterBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        $$('[data-category]').forEach(function (card) {
          var cats = card.getAttribute('data-category').split(' ');
          card.hidden = !(f === 'all' || cats.indexOf(f) !== -1);
        });
      });
    });
  }

  /* ---------- Horizontal strip arrows ---------- */
  $$('[data-strip]').forEach(function (wrap) {
    var strip = $('.strip', wrap);
    $$('[data-dir]', wrap).forEach(function (b) {
      b.addEventListener('click', function () {
        strip.scrollBy({ left: (b.getAttribute('data-dir') === 'next' ? 1 : -1) * strip.clientWidth * 0.8, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    });
  });

  /* ---------- Image viewer ---------- */
  if (window.lightGallery) {
    $$('[data-gallery]').forEach(function (el) {
      var opts = { selector: 'a', download: el.getAttribute('data-gallery') === 'download', speed: 400, mode: 'lg-fade' };
      if (window.lgZoom) opts.plugins = [window.lgZoom];
      window.lightGallery(el, opts);
    });
  }

  /* ---------- Quick answers (works offline, answers from this website's own information) ---------- */
  var KB = [
    { k: ['donat', 'zakat', 'sadaqah', 'bank', 'upi', 'account', 'ifsc', 'pay', 'qr', 'fund', 'support'],
      a: 'You can give by bank transfer or UPI.<br><strong>Canara Bank, Parbhani branch</strong><br>Account no. 120029337799<br>IFSC CNRB0005939<br>Or scan the UPI QR code in <a href="Contact.html#donate">the donation section</a>.' },
    { k: ['volunteer', 'help out', 'join', 'serve', 'seva'],
      a: 'We welcome volunteers for events, tutoring and maintenance. Use the <a href="Contact.html#contact-form">WhatsApp form</a> and choose "Volunteering" as the topic.' },
    { k: ['mutawalli', 'mutawally', 'sajjada', 'trustee', 'caretaker', 'who runs', 'head'],
      a: 'The Sajjada Nashin and Mutawalli is <strong>Mohammad Mushtaque Ahmed</strong>, appointed by the Maharashtra State Board of Waqfs. A Mutawalli is the trustee who administers a Waqf. <a href="single-news-post.html">Read the announcement</a>.' },
    { k: ['phone', 'call', 'number', 'contact', 'mobile', 'whatsapp', 'reach'],
      a: 'Call or WhatsApp the office on <a href="tel:+919421488111">+91 94214 88111</a> or <a href="tel:+919119488111">+91 91194 88111</a>. Email: <a href="mailto:anhparbhani123@gmail.com">anhparbhani123@gmail.com</a>.' },
    { k: ['email', 'mail', 'letter', 'notice', 'official document'],
      a: 'For official documents and formal inquiries, email <a href="mailto:anhparbhani123@gmail.com">anhparbhani123@gmail.com</a>.' },
    { k: ['lease', 'shop', 'rent', 'tenant', 'property', 'auction', 'deposit', 'sublet'],
      a: 'Waqf property is leased for 11 months, 3 years or 30 years for business, residential or educational use, under Maharashtra State Board of Waqfs rules. A deposit is needed to join the auction, and subletting is not allowed. <a href="shop-registration.html">Apply for a lease</a> or <a href="Contact/Waqf%20Rent%20Agreement.pdf">download the rent agreement (PDF)</a>.' },
    { k: ['youth', 'child', 'kids', 'class', 'madrasa', 'islamic studies', 'school', 'register', 'weekend', 'education', 'learn'],
      a: 'The weekend Islamic Studies Program is for ages 7 to 14, every Saturday and Sunday from 10:00 am to 1:00 pm in the Community Education Hall. <a href="youth-program.html#register">Register your child</a>.' },
    { k: ['computer', 'institute', 'it class'],
      a: 'The complex hosts a 24-hour computer institute that offers technical education to students of all backgrounds.' },
    { k: ['history', 'old', 'founded', 'built', 'nizam', 'heritage', 'age', 'year', 'sanad', 'grant'],
      a: 'The land was granted (Inaam) by the 6th Nizam of Hyderabad, H.H. Mir Mahboob Ali Khan. The endowment is recorded as Muntaqab No. 25624, the trust was registered in 1961 (Public Trust No. B.IS 123/61), and it is a registered Waqf (MSBW/PBN/47/2010). <a href="About.html#timeline">See the full history</a>.' },
    { k: ['land', 'acre', 'survey', 'area', 'size', 'map'],
      a: 'The Waqf land totals 13 acres 23 gunthas across Survey No. 1 (3A 30G), No. 2 (8A 15G) and No. 3 (1A 11G). <a href="About.html#land-map">View the land map</a>.' },
    { k: ['case', 'court', 'encroach', 'commission', 'municipal', 'legal', 'notices', 'occupant', 'update', 'news'],
      a: 'In Dec 2024 the Maharashtra State Minority Commission directed the Parbhani Municipal Corporation to return the leased Waqf land. In Jun 2025 the Waqf Board issued notices to 610 occupants. <a href="News.html">Read the latest news</a>.' },
    { k: ['address', 'where', 'location', 'direction', 'route', 'visit'],
      a: 'Ashoorkhana Naale Hyder, Masjid e Mehtab Ali Shah complex, Survey No. 1, 2 & 3, Parbhani, Maharashtra. <a href="https://maps.google.com/?q=19.26620955,76.76450095" target="_blank" rel="noopener">Open in Google Maps</a>.' },
    { k: ['prayer', 'namaz', 'salah', 'time', 'fajr', 'dhuhr', 'zuhr', 'asr', 'maghrib', 'isha', 'jumu', 'friday'],
      a: 'Today\'s prayer times for Parbhani are on the <a href="index.html#prayer">home page</a>. Jumu\'ah is held every Friday with a sermon.' },
    { k: ['nikah', 'marriage', 'wedding'],
      a: 'Nikah can be performed within the premises with proper documentation. Please call the office on <a href="tel:+919421488111">+91 94214 88111</a> to arrange it.' },
    { k: ['waqf', 'endowment', 'meaning', 'what is'],
      a: 'A Waqf is a permanent charitable endowment under Islamic law: the property is dedicated to Allah and can never be sold or gifted, and its benefits serve religious and community purposes.' },
    { k: ['urs', 'turab', 'muharram', 'ashoor', 'event', 'gathering', 'majlis'],
      a: 'The complex hosts religious gatherings through the year, including the Urs of H. Syed Shah Turab Ul Haq and Muharram remembrance at the Ashoorkhana. Follow <a href="https://www.instagram.com/anh_parbhani" target="_blank" rel="noopener">@anh_parbhani</a> for dates.' }
  ];
  function answer(q) {
    var s = q.toLowerCase(), best = null, score = 0;
    KB.forEach(function (e) {
      var n = 0;
      e.k.forEach(function (k) { if (s.indexOf(k) !== -1) n += k.length > 4 ? 2 : 1; });
      if (n > score) { score = n; best = e; }
    });
    return best ? best.a : 'I don\'t have an answer to that on this website. Please message the office on <a href="https://wa.me/' + OFFICE_WA + '" target="_blank" rel="noopener">WhatsApp</a> or call <a href="tel:+919421488111">+91 94214 88111</a>.';
  }
  $$('[data-helper]').forEach(function (box) {
    var log = $('.helper-log', box), form = $('form', box), input = $('input', box);
    function add(html, who) {
      var d = document.createElement('div');
      d.className = 'msg ' + (who === 'user' ? 'msg-user' : 'msg-bot');
      d.innerHTML = html;
      log.appendChild(d);
      log.scrollTop = log.scrollHeight;
    }
    function ask(q) {
      q = (q || '').trim(); if (!q) return;
      add(escapeHtml(q), 'user');
      setTimeout(function () { add(answer(q), 'bot'); }, reduceMotion ? 0 : 250);
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); ask(input.value); input.value = ''; });
    $$('.chip', box).forEach(function (c) { c.addEventListener('click', function () { ask(c.textContent); }); });
  });
})();
