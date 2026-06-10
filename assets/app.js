/* Freshers Kick-Start — site logic.
   Fetches content/chapters.json, renders Markdown chapters (marked),
   highlights code (highlight.js), draws diagrams (mermaid), and tracks
   chapter + section completion in localStorage. */

(function () {
  'use strict';

  // Set to the GitHub repo URL (e.g. 'https://github.com/you/freshers-kick-start')
  // to show the "Star on GitHub" button in the sidebar. Empty = hidden.
  const REPO_URL = 'https://github.com/simantaturja/kickstart';

  const content = document.getElementById('content');
  const chapterNav = document.getElementById('chapterNav');
  const aboutNav = document.getElementById('aboutNav');
  const practiceNav = document.getElementById('practiceNav');
  const pageNav = document.getElementById('pageNav');
  const sidebar = document.getElementById('sidebar');
  const scrim = document.getElementById('scrim');
  const progress = document.getElementById('progress');
  const toTop = document.getElementById('toTop');

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let chapters = [];
  let currentId = null;

  /* ── Theme toggle (initial theme set by inline script in <head>) ── */

  function applyTheme(t) {
    document.documentElement.dataset.theme = t;
    document.querySelectorAll('.theme-toggle').forEach(b => {
      b.textContent = t === 'dark' ? '☀️' : '🌙';
      b.title = t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    });
  }
  applyTheme(document.documentElement.dataset.theme || 'dark');
  document.querySelectorAll('.theme-toggle').forEach(b => b.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('fks-theme', next); } catch { /* private mode */ }
    applyTheme(next);
  }));

  /* ── Star-on-GitHub button ──────────────────────────────── */

  (function initGhStar() {
    const el = document.getElementById('ghStar');
    if (!REPO_URL || !el) return;
    el.href = REPO_URL;
    el.hidden = false;
    // live star count — best-effort, button works fine without it
    const m = REPO_URL.match(/github\.com\/([^/]+\/[^/]+?)(?:\.git|\/)?$/);
    if (!m) return;
    fetch('https://api.github.com/repos/' + m[1])
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d || typeof d.stargazers_count !== 'number') return;
        const c = el.querySelector('.count');
        c.textContent = d.stargazers_count;
        c.hidden = false;
      })
      .catch(() => { /* offline or rate-limited — no count shown */ });
  })();

  /* ── Completion tracking (localStorage) ─────────────────── */

  const store = {
    key: 'fks-progress-v2',
    legacyKey: 'fks-progress-v1',
    read() {
      try {
        const d = JSON.parse(localStorage.getItem(this.key));
        if (d && typeof d === 'object') return { chapters: d.chapters || {}, sections: d.sections || {} };
      } catch { /* fall through */ }
      return { chapters: {}, sections: {} };
    },
    write(data) {
      try { localStorage.setItem(this.key, JSON.stringify(data)); } catch { /* private mode */ }
    },
    isChapterDone(id) { return Boolean(this.read().chapters[id]); },
    isSectionDone(file) { return Boolean(this.read().sections[file]); },
    setChapter(id, done) {
      const d = this.read();
      if (done) d.chapters[id] = d.chapters[id] || new Date().toISOString();
      else delete d.chapters[id];
      this.write(d);
    },
    setSection(file, done) {
      const d = this.read();
      if (done) d.sections[file] = d.sections[file] || new Date().toISOString();
      else delete d.sections[file];
      this.write(d);
    },
    // v1 stored only chapter ids; expand each completed chapter to all its sections
    migrate(chapterList) {
      let legacy;
      try { legacy = JSON.parse(localStorage.getItem(this.legacyKey)); } catch { legacy = null; }
      if (!legacy || typeof legacy !== 'object') return;
      const d = this.read();
      Object.keys(legacy).forEach(id => {
        d.chapters[id] = d.chapters[id] || legacy[id];
        const ch = chapterList.find(c => c.id === id);
        if (ch) ch.files.forEach(f => { d.sections[f] = d.sections[f] || legacy[id]; });
      });
      this.write(d);
      try { localStorage.removeItem(this.legacyKey); } catch { /* ignore */ }
    }
  };

  function trackableChapters() {
    return chapters.filter(c => c.group === 'chapters');
  }

  function renderProgress() {
    const chs = trackableChapters();
    const data = store.read();
    const chDone = chs.filter(c => data.chapters[c.id]).length;
    const allFiles = chs.flatMap(c => c.files);
    const secDone = allFiles.filter(f => data.sections[f]).length;

    document.getElementById('chapterCount').textContent = chDone + '/' + chs.length;
    document.getElementById('chapterFill').style.width =
      chs.length ? (chDone / chs.length * 100) + '%' : '0';
    document.getElementById('sectionCount').textContent = secDone + '/' + allFiles.length;
    document.getElementById('sectionFill').style.width =
      allFiles.length ? (secDone / allFiles.length * 100) + '%' : '0';
    document.getElementById('progressCard').classList.toggle('done', chs.length > 0 && chDone === chs.length);

    document.querySelectorAll('.nav a[data-id]').forEach(a => {
      a.classList.toggle('completed', Boolean(data.chapters[a.dataset.id]));
    });
  }

  function celebrate() {
    if (reducedMotion || typeof confetti !== 'function') return;
    confetti({ particleCount: 90, spread: 70, origin: { x: 0.2, y: 0.8 } });
    confetti({ particleCount: 90, spread: 70, origin: { x: 0.8, y: 0.8 } });
  }

  /* ── Markdown / rendering setup ─────────────────────────── */

  marked.setOptions({ gfm: true, breaks: false });

  if (window.mermaid) {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      theme: 'base',
      themeVariables: {
        darkMode: true,
        background: '#161922',
        primaryColor: '#1b1f2a',
        primaryTextColor: '#d6dae3',
        primaryBorderColor: '#3a4358',
        lineColor: '#6ea8fe',
        secondaryColor: '#2b3a5c',
        tertiaryColor: '#161922',
        noteBkgColor: '#2b3a5c',
        noteTextColor: '#d6dae3',
        noteBorderColor: '#3a4358',
        actorBkg: '#1b1f2a',
        actorBorder: '#6ea8fe',
        actorTextColor: '#d6dae3',
        signalColor: '#9aa3b2',
        signalTextColor: '#d6dae3',
        labelBoxBkgColor: '#2b3a5c',
        labelTextColor: '#d6dae3',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '14px'
      },
      flowchart: { curve: 'basis' }
    });
  }

  function slugify(t) {
    return t.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  }

  /* ── Sidebar navigation ─────────────────────────────────── */

  let spy = null;

  function buildPageNav() {
    pageNav.innerHTML = '';
    const heads = content.querySelectorAll('h2, h3');
    heads.forEach(h => {
      if (!h.id) h.id = slugify(h.textContent);
      const a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent;
      if (h.tagName === 'H3') {
        a.classList.add('sub');
      } else {
        const sec = h.closest('.chapter-section');
        if (sec) {
          a.dataset.file = sec.dataset.file;
          const check = document.createElement('span');
          check.className = 'check';
          check.textContent = '✓';
          a.appendChild(check);
        }
      }
      a.addEventListener('click', () => closeSidebar());
      pageNav.appendChild(a);
    });

    // scrollspy: highlight the section currently in view
    if (spy) spy.disconnect();
    if (!heads.length || !('IntersectionObserver' in window)) return;
    spy = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        pageNav.querySelectorAll('a').forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id);
        });
      });
    }, { rootMargin: '-10% 0px -75% 0px' });
    heads.forEach(h => spy.observe(h));
  }

  function setActiveChapter(id) {
    document.querySelectorAll('.nav a[data-id]').forEach(a => {
      a.classList.toggle('active', a.getAttribute('data-id') === id);
    });
  }

  function buildChapterNav() {
    chapters.forEach(ch => {
      const a = document.createElement('a');
      a.href = '#' + ch.id;
      a.dataset.id = ch.id;
      a.textContent = ch.title;
      const check = document.createElement('span');
      check.className = 'check';
      check.textContent = '✓';
      a.appendChild(check);
      a.addEventListener('click', e => {
        e.preventDefault();
        load(ch.id, true);
        closeSidebar();
      });
      const target = { about: aboutNav, practice: practiceNav }[ch.group] || chapterNav;
      target.appendChild(a);
    });
  }

  /* ── Section read-state UI ──────────────────────────────── */

  // Sync every per-section control on the page with the store:
  // the "mark as read" buttons and the ✓ marks in "On this page".
  function updateSectionUI() {
    content.querySelectorAll('.chapter-section').forEach(sec => {
      const done = store.isSectionDone(sec.dataset.file);
      sec.classList.toggle('read', done);
      const btn = sec.querySelector('.section-done button');
      if (btn) {
        btn.classList.toggle('done', done);
        btn.textContent = done ? '✓ Read' : '○ Mark as read';
      }
    });
    pageNav.querySelectorAll('a[data-file]').forEach(a => {
      a.classList.toggle('completed', store.isSectionDone(a.dataset.file));
    });
  }

  function syncCompleteButton(ch) {
    const btn = content.querySelector('.complete-btn');
    if (!btn) return;
    const done = store.isChapterDone(ch.id);
    btn.classList.toggle('done', done);
    btn.textContent = done ? '✓ Chapter completed — tap to undo' : '○ Mark chapter as complete';
  }

  function toggleSection(ch, file) {
    store.setSection(file, !store.isSectionDone(file));
    // chapter completion is derived: done ⇔ every section read
    const allRead = ch.files.every(f => store.isSectionDone(f));
    const wasDone = store.isChapterDone(ch.id);
    store.setChapter(ch.id, allRead);
    updateSectionUI();
    syncCompleteButton(ch);
    renderProgress();
    if (allRead && !wasDone) celebrate();
  }

  function buildSectionToggles(ch) {
    if (ch.group !== 'chapters') return;
    content.querySelectorAll('.chapter-section').forEach(sec => {
      const wrap = document.createElement('div');
      wrap.className = 'section-done';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.addEventListener('click', () => toggleSection(ch, sec.dataset.file));
      wrap.appendChild(btn);
      sec.appendChild(wrap);
    });
  }

  /* ── Per-chapter extras injected after render ───────────── */

  function injectMeta(markdown) {
    const h1 = content.querySelector('h1');
    if (!h1) return;
    const words = markdown.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
    const mins = Math.max(1, Math.round(words / 200));
    const quizzes = content.querySelectorAll('.quiz').length;
    const meta = document.createElement('p');
    meta.className = 'chapter-meta';
    let html = '<span>📖 ~' + mins + ' min read</span>';
    if (quizzes) html += '<span>⚡ ' + quizzes + ' quick check' + (quizzes > 1 ? 's' : '') + '</span>';
    meta.innerHTML = html;
    h1.after(meta);
  }

  function buildCompleteButton(ch) {
    if (ch.group !== 'chapters') return;
    const wrap = document.createElement('div');
    wrap.className = 'chapter-actions';
    const btn = document.createElement('button');
    btn.className = 'complete-btn';
    btn.type = 'button';
    btn.addEventListener('click', () => {
      const nowDone = !store.isChapterDone(ch.id);
      store.setChapter(ch.id, nowDone);
      ch.files.forEach(f => store.setSection(f, nowDone)); // keep sections in sync
      syncCompleteButton(ch);
      updateSectionUI();
      renderProgress();
      if (nowDone) celebrate();
    });
    wrap.appendChild(btn);
    content.appendChild(wrap);
    syncCompleteButton(ch);
  }

  function buildPager() {
    const i = chapters.findIndex(c => c.id === currentId);
    const prev = chapters[i - 1];
    const next = chapters[i + 1];
    if (!prev && !next) return;
    const nav = document.createElement('nav');
    nav.className = 'pager';
    const mk = (ch, dir) => {
      const a = document.createElement('a');
      a.href = '#' + ch.id;
      a.className = dir;
      a.innerHTML = '<span class="dir">' + (dir === 'prev' ? '← Previous' : 'Next →') + '</span>' +
        '<span class="title"></span>';
      a.querySelector('.title').textContent = ch.title;
      a.addEventListener('click', e => {
        e.preventDefault();
        load(ch.id, true);
      });
      return a;
    };
    if (prev) nav.appendChild(mk(prev, 'prev'));
    else nav.insertAdjacentHTML('beforeend', '<span class="spacer"></span>');
    if (next) nav.appendChild(mk(next, 'next'));
    content.appendChild(nav);
  }

  /* ── Chapter loading ────────────────────────────────────── */

  async function load(id, push) {
    const ch = chapters.find(c => c.id === id);
    if (!ch) return;
    currentId = id;
    content.innerHTML = '<div class="loader">Loading…</div>';
    try {
      const parts = await Promise.all(ch.files.map(async f => {
        const res = await fetch(f, { cache: 'no-cache' });
        if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + f);
        return res.text();
      }));

      // one <section> per source file, so each section can be tracked by its path
      content.innerHTML = '';
      ch.files.forEach((f, idx) => {
        const sec = document.createElement('section');
        sec.className = 'chapter-section';
        sec.dataset.file = f;
        sec.innerHTML = marked.parse(parts[idx]);
        content.appendChild(sec);
      });

      // mermaid code fences → rendered diagrams
      content.querySelectorAll('pre code.language-mermaid').forEach(b => {
        const d = document.createElement('div');
        d.className = 'mermaid';
        d.textContent = b.textContent;
        b.closest('pre').replaceWith(d);
      });
      content.querySelectorAll('pre code').forEach(b => hljs.highlightElement(b));
      if (window.mermaid) {
        try { await mermaid.run({ nodes: content.querySelectorAll('.mermaid') }); }
        catch (e) { console.warn('mermaid render failed', e); }
      }

      injectMeta(parts.join('\n\n'));
      buildSectionToggles(ch);
      buildCompleteButton(ch);
      buildPager();
      buildPageNav();
      updateSectionUI();
      setActiveChapter(id);
      renderProgress();

      content.classList.remove('fade');
      void content.offsetWidth; // restart the fade-in animation
      content.classList.add('fade');

      window.scrollTo(0, 0);
      if (push) history.pushState(null, '', '#' + id);
    } catch (e) {
      content.innerHTML = '<div class="err"><h3>Could not load chapter <code>' + id + '</code></h3>' +
        '<p>' + e.message + '</p>' +
        '<p>If you opened this file directly (<code>file://</code>), browsers block loading local Markdown. ' +
        'Run a tiny local server from this folder instead:</p>' +
        '<pre><code>python3 -m http.server 8000</code></pre>' +
        '<p>Then open <a href="http://localhost:8000">http://localhost:8000</a>.</p></div>';
    }
  }

  /* ── Quizzes: first click locks in the answer ───────────── */

  content.addEventListener('click', e => {
    const btn = e.target.closest('.quiz-opt');
    if (!btn) return;
    const quiz = btn.closest('.quiz');
    if (!quiz || quiz.classList.contains('answered')) return;
    quiz.classList.add('answered');
    btn.classList.add(btn.hasAttribute('data-correct') ? 'right' : 'wrong');
    quiz.querySelectorAll('.quiz-opt[data-correct]').forEach(b => b.classList.add('right'));
    const why = quiz.querySelector('.quiz-why');
    if (why) why.classList.add('show');
  });

  /* ── Mobile sidebar ─────────────────────────────────────── */

  function openSidebar() { sidebar.classList.add('open'); scrim.classList.add('show'); }
  function closeSidebar() { sidebar.classList.remove('open'); scrim.classList.remove('show'); }
  document.getElementById('menuBtn').addEventListener('click', openSidebar);
  scrim.addEventListener('click', closeSidebar);

  /* ── Keyboard: ←/→ move between chapters ────────────────── */

  document.addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.closest('input, textarea, select, [contenteditable]')) return;
    const i = chapters.findIndex(c => c.id === currentId);
    if (e.key === 'ArrowRight' && chapters[i + 1]) load(chapters[i + 1].id, true);
    if (e.key === 'ArrowLeft' && chapters[i - 1]) load(chapters[i - 1].id, true);
  });

  /* ── Hash navigation (cross-chapter links, back/forward) ── */

  window.addEventListener('hashchange', () => {
    const id = location.hash.slice(1);
    if (id !== currentId && chapters.some(c => c.id === id)) load(id, false);
  });

  /* ── Scroll: progress bar + back-to-top ─────────────────── */

  window.addEventListener('scroll', () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    progress.style.width = max > 0 ? (h.scrollTop / max * 100) + '%' : '0';
    toTop.classList.toggle('show', h.scrollTop > 600);
  });
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' }));

  /* ── Boot ───────────────────────────────────────────────── */

  (async function init() {
    try {
      const res = await fetch('content/chapters.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      chapters = await res.json();
    } catch (e) {
      content.innerHTML = '<div class="err"><h3>Could not load <code>content/chapters.json</code></h3>' +
        '<p>' + e.message + '</p>' +
        '<p>If you opened this file directly (<code>file://</code>), browsers block loading local files. ' +
        'Run a tiny local server from this folder instead:</p>' +
        '<pre><code>python3 -m http.server 8000</code></pre>' +
        '<p>Then open <a href="http://localhost:8000">http://localhost:8000</a>.</p></div>';
      return;
    }
    store.migrate(chapters);
    buildChapterNav();
    renderProgress();
    const hashId = location.hash.slice(1);
    load(chapters.some(c => c.id === hashId) ? hashId : 'intro', false);
  })();
})();
