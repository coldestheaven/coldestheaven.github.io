// 俄罗斯方块：7-bag 随机、旋转、消行、等级加速、幽灵落点
(function () {
  const canvas = document.getElementById('tetrisCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const nextCanvas = document.getElementById('tetrisNext');
  const nctx = nextCanvas.getContext('2d');
  const overlay = document.getElementById('tetrisOverlay');
  const title = document.getElementById('tetrisOverlayTitle');
  const text = document.getElementById('tetrisOverlayText');
  const btn = document.getElementById('tetrisOverlayBtn');
  const scoreEl = document.getElementById('tetrisScore');
  const levelEl = document.getElementById('tetrisLevel');
  const linesEl = document.getElementById('tetrisLines');
  const pauseBtn = document.getElementById('tetrisPause');
  const COLS = 10, ROWS = 20, CELL = 30;
  const SHAPES = {
    I: [[0, 1], [1, 1], [2, 1], [3, 1]],
    O: [[1, 0], [2, 0], [1, 1], [2, 1]],
    T: [[1, 0], [0, 1], [1, 1], [2, 1]],
    S: [[1, 0], [2, 0], [0, 1], [1, 1]],
    Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
    J: [[0, 0], [0, 1], [1, 1], [2, 1]],
    L: [[2, 0], [0, 1], [1, 1], [2, 1]]
  };
  const COLORS = { I: '#22d3ee', O: '#facc15', T: '#a78bfa', S: '#4ade80', Z: '#f87171', J: '#60a5fa', L: '#fb923c' };
  const TYPES = Object.keys(SHAPES);
  let board, piece, nextType, bag = [];
  let score, lines, level, state = 'ready', active = false, last = 0, dropTimer = 0;

  function refillBag() {
    bag = TYPES.slice();
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
  }
  function takeType() { if (!bag.length) refillBag(); return bag.pop(); }
  function rotated(cells) { return cells.map(([x, y]) => [3 - y, x]); }
  function valid(cells, px, py) {
    return cells.every(([x, y]) => {
      const bx = px + x, by = py + y;
      return bx >= 0 && bx < COLS && by < ROWS && (by < 0 || !board[by][bx]);
    });
  }
  function spawn() {
    const type = nextType || takeType();
    nextType = takeType();
    piece = { type, cells: SHAPES[type].map(c => c.slice()), x: 3, y: 0 };
    if (!valid(piece.cells, piece.x, piece.y)) gameOver();
    drawNext();
  }
  function updateHud() {
    scoreEl.textContent = score; levelEl.textContent = level; linesEl.textContent = lines;
  }
  function showOverlay(t, s, label) {
    title.textContent = t; text.textContent = s; btn.textContent = label;
    overlay.classList.add('show');
  }
  function start() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    score = 0; lines = 0; level = 1; dropTimer = 0; bag = []; nextType = takeType();
    state = 'playing'; overlay.classList.remove('show'); updateHud(); spawn();
  }
  function gameOver() {
    state = 'over';
    showOverlay('游戏结束', '得分 ' + score + ' · 消除 ' + lines + ' 行', '再来一局');
  }
  function pause() {
    if (state === 'playing') {
      state = 'paused'; showOverlay('暂停', '休息一下，随时继续。', '继续游戏');
    } else if (state === 'paused') {
      state = 'playing'; overlay.classList.remove('show');
    }
  }
  function move(dx) { if (valid(piece.cells, piece.x + dx, piece.y)) piece.x += dx; }
  function rotate() {
    const cells = rotated(piece.cells);
    for (const k of [0, -1, 1, -2, 2]) {
      if (valid(cells, piece.x + k, piece.y)) { piece.cells = cells; piece.x += k; return; }
    }
  }
  function step() {
    if (valid(piece.cells, piece.x, piece.y + 1)) piece.y++;
    else lock();
  }
  function drop() {
    while (valid(piece.cells, piece.x, piece.y + 1)) piece.y++;
    lock();
  }
  function lock() {
    piece.cells.forEach(([x, y]) => {
      const by = piece.y + y, bx = piece.x + x;
      if (by >= 0 && by < ROWS) board[by][bx] = COLORS[piece.type];
    });
    let cleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (board[y].every(Boolean)) { board.splice(y, 1); board.unshift(Array(COLS).fill(null)); cleared++; y++; }
    }
    score += [0, 100, 300, 500, 800][cleared] * level;
    lines += cleared;
    level = Math.floor(lines / 10) + 1;
    updateHud(); spawn(); dropTimer = 0;
  }
  function speed() { return Math.max(100, 700 - (level - 1) * 60); }

  function drawCell(c, x, y, color, alpha) {
    c.globalAlpha = alpha || 1;
    c.fillStyle = color;
    c.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
    c.fillStyle = 'rgba(255,255,255,.22)';
    c.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, 3);
    c.globalAlpha = 1;
  }
  function drawNext() {
    nctx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (!nextType) return;
    const cells = SHAPES[nextType];
    const xs = cells.map(c => c[0]), ys = cells.map(c => c[1]);
    const ox = 2 - Math.min(...xs), oy = 1 - Math.min(...ys);
    cells.forEach(([x, y]) => {
      nctx.fillStyle = COLORS[nextType];
      nctx.fillRect((x + ox) * 20 + 1, (y + oy) * 20 + 1, 18, 18);
    });
  }
  function draw() {
    ctx.fillStyle = '#0b1020'; ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);
    ctx.strokeStyle = 'rgba(255,255,255,.045)'; ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x * CELL + .5, 0); ctx.lineTo(x * CELL + .5, ROWS * CELL); ctx.stroke(); }
    for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * CELL + .5); ctx.lineTo(COLS * CELL, y * CELL + .5); ctx.stroke(); }
    if (!board) return;
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (board[y][x]) drawCell(ctx, x, y, board[y][x]);
    if (piece && state === 'playing') {
      let gy = piece.y;
      while (valid(piece.cells, piece.x, gy + 1)) gy++;
      piece.cells.forEach(([x, y]) => { if (gy + y >= 0) drawCell(ctx, piece.x + x, gy + y, COLORS[piece.type], 0.25); });
      piece.cells.forEach(([x, y]) => { if (piece.y + y >= 0) drawCell(ctx, piece.x + x, piece.y + y, COLORS[piece.type]); });
    }
  }
  function loop(ts) {
    const dt = Math.min(50, ts - last || 16); last = ts;
    if (state === 'playing' && active) {
      dropTimer += dt;
      if (dropTimer >= speed()) { dropTimer = 0; step(); }
    }
    draw(); requestAnimationFrame(loop);
  }

  const single = { ArrowLeft: () => move(-1), ArrowRight: () => move(1), ArrowDown: () => step(), ArrowUp: () => rotate(), ' ': () => drop() };
  window.addEventListener('keydown', e => {
    if (!active || state !== 'playing') {
      if (e.key.toLowerCase() === 'p' && state === 'paused') { pause(); e.preventDefault(); }
      return;
    }
    const k = e.key === ' ' ? ' ' : e.key;
    if (single[k]) { e.preventDefault(); single[k](); }
    else if (e.key.toLowerCase() === 'p') { e.preventDefault(); pause(); }
  });
  const dropBtn = document.querySelector('#tetris [data-act="drop"]');
  if (dropBtn) {
    let dropHandled = false;
    dropBtn.setAttribute('aria-pressed', 'false');
    dropBtn.addEventListener('pointerdown', e => {
      e.preventDefault();
      try { dropBtn.setPointerCapture?.(e.pointerId); } catch (_) {}
      dropHandled = true;
      dropBtn.classList.add('is-pressed'); dropBtn.setAttribute('aria-pressed', 'true');
      if (state === 'playing') drop();
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev =>
      dropBtn.addEventListener(ev, () => {
        dropBtn.classList.remove('is-pressed'); dropBtn.setAttribute('aria-pressed', 'false');
      }));
    dropBtn.addEventListener('click', () => {
      if (dropHandled) { dropHandled = false; return; }
      if (state === 'playing') drop();
    });
  }
  const stick = document.getElementById('tetrisJoystick');
  if (stick) {
    let stickTimer = null, stickDir = null;
    const act = dir => {
      if (state !== 'playing') return;
      if (dir === 'left') move(-1);
      else if (dir === 'right') move(1);
      else if (dir === 'up') rotate();
      else if (dir === 'down') { step(); dropTimer = 0; }
    };
    const stop = () => { clearInterval(stickTimer); stickTimer = null; stickDir = null; };
    stick.addEventListener('joystickmove', e => {
      const dir = e.detail.dir;
      if (dir === stickDir) return;
      stop();
      stickDir = dir;
      if (!dir) return;
      act(dir);
      stickTimer = setInterval(() => act(dir), dir === 'up' ? 180 : 110);
    });
    stick.addEventListener('joystickend', stop);
    window.addEventListener('blur', stop);
  }
  pauseBtn.addEventListener('click', () => { if (state === 'playing' || state === 'paused') pause(); });
  btn.addEventListener('click', () => {
    window.arcadeFs.enter(document.getElementById('tetrisShell'));
    if (state === 'paused') pause(); else start();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { active = entries[0].isIntersecting; }, { threshold: 0.1 }).observe(canvas);
  } else active = true;
  updateHud(); requestAnimationFrame(loop);
})();
