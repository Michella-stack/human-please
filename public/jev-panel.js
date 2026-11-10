(function () {
  if (window.__jevPanel) return;
  window.__jevPanel = true;

  // Same thresholds as server.js, shown to the user.
  const LIMIT = { frustration: 2, confidence: 0.8, human: 0.8 };

  const LINES = {
    idle: ["Hi, I'm JEV. Say something."],
    thinking: ["Reading the room…", "Hold on, vibes loading…"],
    calm: ["Vibes: immaculate.", "All good. Carry on.", "Smooth sailing."],
    spicy: ["Hmm. Getting spicy.", "I sense a sigh.", "Careful now…"],
    escalate: ["Right. Fetching a human.", "That's it. Calling backup.", "Human incoming. Stand by."],
    human: ["Say no more. Human incoming.", "Understood. Getting a person."]
  };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const clamp = (n) => Math.max(0, Math.min(100, n));

  const CSS = `
     #jev-art img{width:170px;height:210px;object-fit:cover;object-position:center top}
  #jev-panel{position:fixed;top:16px;right:16px;width:290px;max-height:calc(100vh - 32px);overflow:auto;z-index:1000;background:#fff;color:#0b0b0b;border:2px solid #0b0b0b;box-shadow:6px 6px 0 #1f6b3a;font:13px/1.5 "JetBrains Mono",ui-monospace,Menlo,Consolas,monospace}
  #jev-panel *{box-sizing:border-box}
  .jev-head{display:flex;justify-content:space-between;align-items:center;background:#0b0b0b;color:#fff;padding:4px 10px;font-weight:700;letter-spacing:.04em}
  #jev-min{font:inherit;background:transparent;color:#fff;border:1px solid #fff;padding:0 8px;cursor:pointer}
  #jev-min:hover{background:#1f6b3a}
  .jev-body{padding:12px}
  #jev-panel.min .jev-body{display:none}
  #jev-bubble{position:relative;border:2px solid #0b0b0b;padding:8px 10px;margin-bottom:14px;font-weight:700;background:#fff}
  #jev-bubble::after{content:"";position:absolute;left:50%;bottom:-10px;width:14px;height:14px;background:#fff;border-right:2px solid #0b0b0b;border-bottom:2px solid #0b0b0b;transform:translateX(-50%) rotate(45deg)}
  #jev-figure{margin:0 0 10px;text-align:center}
  #jev-art svg,#jev-art img{display:block;width:150px;height:auto;margin:0 auto;transform:rotate(-3deg);
    filter:drop-shadow(2px 0 0 #fff) drop-shadow(-2px 0 0 #fff) drop-shadow(0 2px 0 #fff) drop-shadow(0 -2px 0 #fff) drop-shadow(4px 6px 0 rgba(11,11,11,.35))}
  #jev-figure figcaption{margin-top:6px;font-size:11px;color:#55655a}
  #jev-verdict{text-align:center;font-weight:700;padding:6px;margin-bottom:12px;border:2px solid #0b0b0b}
  #jev-verdict.idle{border-style:dashed;color:#55655a}
  #jev-verdict.keep{background:#1f6b3a;color:#fff}
  #jev-verdict.connect{background:#0b0b0b;color:#fff}
  .jev-row{margin-bottom:12px}
  .jev-label{display:flex;justify-content:space-between;font-weight:700}
  .jev-row.hit .jev-label b::after{content:" · TRIGGERED";color:#1f6b3a}
  .jev-bar{position:relative;height:14px;border:2px solid #0b0b0b;margin-top:6px}
  .band3{background:linear-gradient(90deg,#e6f2e9 0 33.34%,#b9d6c1 33.34% 66.67%,#0b0b0b 66.67% 100%)}
  .band2{background:linear-gradient(90deg,#e6f2e9 0 80%,#0b0b0b 80% 100%)}
  .jev-bar i{position:absolute;top:-5px;bottom:-5px;width:6px;margin-left:-3px;background:#1f6b3a;box-shadow:0 0 0 2px #fff,0 0 0 4px #0b0b0b;display:none;transition:left .4s ease}
  .jev-hint{font-size:11px;color:#55655a;margin-top:4px}
  #jev-panel.thinking #jev-art svg,#jev-panel.thinking #jev-art img{animation:jev-wobble .45s ease-in-out infinite alternate}
  @keyframes jev-wobble{from{transform:rotate(-5deg)}to{transform:rotate(2deg)}}
  @media (prefers-reduced-motion:reduce){#jev-panel *{animation:none!important;transition:none!important}}
  @media (max-width:1100px){#jev-panel{top:auto;bottom:8px;left:8px;right:8px;width:auto;max-height:50vh}}
  `;

  const CARTOON = `
  <svg viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="JEV, cartoon cardboard cutout">
    <path d="M20 260C20 205 55 190 100 190C145 190 180 205 180 260Z" fill="#1f6b3a" stroke="#0b0b0b" stroke-width="4"/>
    <rect x="84" y="160" width="32" height="34" fill="#fff" stroke="#0b0b0b" stroke-width="4"/>
    <path d="M55 70C55 35 145 35 145 70L145 130C145 160 125 175 100 175C75 175 55 160 55 130Z" fill="#fff" stroke="#0b0b0b" stroke-width="4"/>
    <path d="M52 78C46 28 154 22 148 78C135 56 65 56 52 78Z" fill="#0b0b0b"/>
    <path d="M70 90L92 85M108 85L130 90" stroke="#0b0b0b" stroke-width="5" stroke-linecap="round"/>
    <circle cx="82" cy="104" r="5" fill="#0b0b0b"/><circle cx="118" cy="104" r="5" fill="#0b0b0b"/>
    <path d="M70 130Q100 164 130 130Z" fill="#fff" stroke="#0b0b0b" stroke-width="4" stroke-linejoin="round"/>
    <path d="M96 164Q100 168 104 164" stroke="#0b0b0b" stroke-width="3" fill="none" stroke-linecap="round"/>
    <text x="100" y="238" text-anchor="middle" font-family="monospace" font-weight="700" font-size="28" fill="#fff">JEV</text>
  </svg>`;

  const HTML = `
  <div class="jev-head"><span>JEV // AI AGENT</span><button id="jev-min" aria-label="Minimise JEV panel">–</button></div>
  <div class="jev-body">
    <div id="jev-bubble" aria-live="polite">${LINES.idle[0]}</div>
    <figure id="jev-figure"><div id="jev-art">${CARTOON}</div><figcaption>JEV · support agent</figcaption></figure>
    <div id="jev-verdict" class="idle">WAITING FOR A MESSAGE</div>

    <div class="jev-row" id="jev-r1">
      <div class="jev-label"><span>Frustration</span><b id="jev-v1">n/a</b></div>
      <div class="jev-bar band3"><i id="jev-m1"></i></div>
      <div class="jev-hint">calm · spicy · human. Connects at 2 or more (scale 0 to 3).</div>
    </div>
    <div class="jev-row" id="jev-r2">
      <div class="jev-label"><span>Sentiment</span><b id="jev-v2">n/a</b></div>
      <div class="jev-bar band2"><i id="jev-m2"></i></div>
      <div class="jev-hint">Connects if frustrated or angry and over 80% sure.</div>
    </div>
    <div class="jev-row" id="jev-r3">
      <div class="jev-label"><span>Asked for a human</span><b id="jev-v3">n/a</b></div>
      <div class="jev-bar band2"><i id="jev-m3"></i></div>
      <div class="jev-hint">Connects if over 80% likely.</div>
    </div>
  </div>`;

  let panel = null;
  const $ = (id) => document.getElementById(id);

  function init() {
    const font = document.createElement('link');
    font.rel = 'stylesheet';
    font.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap';
    document.head.appendChild(font);

    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    panel = document.createElement('aside');
    panel.id = 'jev-panel';
    panel.innerHTML = HTML;
    document.body.appendChild(panel);

    $('jev-min').addEventListener('click', () => panel.classList.toggle('min'));

    // If you save a picture as public/jev.png it replaces the cartoon.
    const probe = new Image();
    probe.alt = 'JEV';
    probe.onload = () => $('jev-art').replaceChildren(probe);
    probe.src = 'jev.png';
  }

  function say(text) { $('jev-bubble').textContent = text; }

  function setVerdict(kind, text) {
    const v = $('jev-verdict');
    v.className = kind;
    v.textContent = text;
  }

  function setRow(n, pct, text, hit) {
    const m = $('jev-m' + n);
    if (pct === null) {
      m.style.display = 'none';
    } else {
      m.style.display = 'block';
      m.style.left = clamp(pct) + '%';
    }
    $('jev-v' + n).textContent = text;
    $('jev-r' + n).classList.toggle('hit', !!hit);
  }

  function thinking(on) {
    if (!panel) return;
    panel.classList.toggle('thinking', on);
    if (on) { say(pick(LINES.thinking)); setVerdict('idle', 'JEV IS THINKING…'); }
  }

  function fail() {
    if (!panel) return;
    say('I lost the plot. Keep chatting.');
    setVerdict('idle', 'NO READING THIS TIME');
  }

  function show(data) {
    if (!panel || !data || !data.action) return;
    const s = data.scores || {};
    const num = (v) => (v !== undefined && v !== null && isFinite(v) ? Number(v) : null);
    const frus = num(s.frustrationScore);
    const conf = num(s.sentimentConfidence);
    const human = num(s.wantsHumanProbability);
    const sent = s.sentiment ? String(s.sentiment) : null;
    const negative = sent === 'frustrated' || sent === 'angry';
    const connect = data.action === 'offer_escalation';

    setRow(1, frus === null ? null : (frus / 3) * 100,
      frus === null ? 'n/a' : frus.toFixed(1) + ' / 3',
      frus !== null && frus >= LIMIT.frustration);

    setRow(2, conf === null ? null : conf * 100,
      sent && conf !== null ? sent + ' ' + Math.round(conf * 100) + '%' : 'n/a',
      negative && conf !== null && conf > LIMIT.confidence);

    setRow(3, human === null ? null : human * 100,
      human === null ? 'n/a' : Math.round(human * 100) + '%',
      human !== null && human > LIMIT.human);

    if (connect) {
      setVerdict('connect', 'CONNECT TO LIVE AGENT');
      say(pick(human !== null && human > LIMIT.human ? LINES.human : LINES.escalate));
    } else {
      setVerdict('keep', 'KEEP CHATTING WITH THE BOT');
      say(pick(frus !== null && frus >= 1 ? LINES.spicy : LINES.calm));
    }
  }

  // Listen to the existing /api/evaluate call without changing customer.js.
  const realFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    const watching = url.indexOf('/api/evaluate') !== -1;
    if (watching) thinking(true);
    const p = realFetch(input, init);
    if (watching) {
      p.then((r) => r.clone().json())
        .then(show)
        .catch(fail)
        .finally(() => thinking(false));
    }
    return p;
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();