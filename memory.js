// 记忆翻牌：4x4 共 8 对，翻开两张配对，记录步数与用时
(function () {
  const board = document.getElementById('memoryBoard');
  if (!board) return;
  const movesEl = document.getElementById('memoryMoves');
  const timeEl = document.getElementById('memoryTime');
  const matchedEl = document.getElementById('memoryMatched');
  const bestEl = document.getElementById('memoryBest');
  const overlay = document.getElementById('memoryOverlay');
  const title = document.getElementById('memoryOverlayTitle');
  const text = document.getElementById('memoryOverlayText');
  const btn = document.getElementById('memoryOverlayBtn');
  const ICONS = ['🎮', '🚀', '👾', '🕹️', '🎲', '🧩', '⚡', '🏆'];
  let deck = [], first = null, busy = false;
  let moves, matched, seconds, timer = null, state = 'ready', active = false;
  let best = Number(localStorage.getItem('gdbmemorybest') || 0);

  function fmt(s) { return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }
  function updateHud() {
    movesEl.textContent = moves;
    timeEl.textContent = fmt(seconds);
    matchedEl.textContent = matched + '/8';
    bestEl.textContent = best ? fmt(best) : '—';
  }
  function render() {
    board.innerHTML = '';
    deck.forEach((icon, i) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'mem-card' + (cardState[i] === 'open' || cardState[i] === 'matched' ? ' flipped' : '') + (cardState[i] === 'matched' ? ' matched' : '');
      el.textContent = cardState[i] === 'open' || cardState[i] === 'matched' ? icon : '?';
      el.setAttribute('aria-label', cardState[i] === 'open' || cardState[i] === 'matched' ? icon : '未翻开的卡片');
      el.addEventListener('click', () => flip(i));
      board.appendChild(el);
    });
  }
  let cardState = [];
  function start() {
    deck = ICONS.concat(ICONS).sort(() => Math.random() - 0.5);
    cardState = Array(16).fill('closed');
    first = null; busy = false; moves = 0; matched = 0; seconds = 0;
    state = 'playing'; overlay.classList.remove('show');
    clearInterval(timer); timer = setInterval(() => {
      if (state === 'playing') { seconds++; updateHud(); }
    }, 1000);
    updateHud(); render();
  }
  function flip(i) {
    if (!active || state !== 'playing' || busy || cardState[i] !== 'closed') return;
    cardState[i] = 'open'; render();
    if (first === null) { first = i; return; }
    moves++;
    const a = first, b = i;
    first = null;
    if (deck[a] === deck[b]) {
      cardState[a] = cardState[b] = 'matched';
      matched++;
      updateHud(); render();
      if (matched === 8) {
        state = 'over'; clearInterval(timer);
        if (!best || seconds < best) { best = seconds; localStorage.setItem('gdbmemorybest', String(best)); }
        title.textContent = '全部配对！';
        text.textContent = '用时 ' + fmt(seconds) + ' · ' + moves + ' 步' + (best === seconds ? ' · 新纪录！' : '');
        btn.textContent = '再玩一次';
        overlay.classList.add('show');
        updateHud();
      }
    } else {
      busy = true; updateHud();
      setTimeout(() => {
        cardState[a] = cardState[b] = 'closed';
        busy = false; render();
      }, 650);
    }
  }
  btn.addEventListener('click', () => {
    window.arcadeFs.enter(document.getElementById('memoryShell'));
    start();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { active = entries[0].isIntersecting; }, { threshold: 0.1 }).observe(board);
  } else active = true;
  deck = ICONS.concat(ICONS).sort(() => Math.random() - 0.5);
  cardState = Array(16).fill('closed');
  moves = 0; matched = 0; seconds = 0; updateHud(); render();
})();
