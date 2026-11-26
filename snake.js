// 贪吃蛇：纯 Canvas 实现，支持键盘与触屏
(function () {
  const canvas = document.getElementById('snakeCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const T = 24, COLS = 20, ROWS = 20;
  const overlay = document.getElementById('snakeOverlay');
  const title = document.getElementById('snakeOverlayTitle');
  const text = document.getElementById('snakeOverlayText');
  const btn = document.getElementById('snakeOverlayBtn');
  const scoreEl = document.getElementById('snakeScore');
  const lenEl = document.getElementById('snakeLength');
  const bestEl = document.getElementById('snakeBest');

  let snake, dir, nextDir, food, score = 0, best = Number(localStorage.getItem('snake-best')) || 0;
  let tickMs = 130, acc = 0, state = 'ready', active = false, last = 0;

  function updateHud() {
    scoreEl.textContent = score;
    lenEl.textContent = snake ? snake.length : 3;
    bestEl.textContent = best;
  }
  function placeFood() {
    do {
      food = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    } while (snake.some(s => s.x === food.x && s.y === food.y));
  }
  function reset() {
    snake = [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }];
    dir = { x: 1, y: 0 }; nextDir = dir;
    score = 0; tickMs = 130; acc = 0;
    placeFood(); updateHud();
    state = 'playing'; overlay.classList.remove('show');
  }
  function setDir(x, y) {
    if (dir.x === -x && dir.y === -y) return;
    nextDir = { x, y };
  }
  function step() {
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS ||
        snake.some(s => s.x === head.x && s.y === head.y)) {
      state = 'over';
      if (score > best) { best = score; localStorage.setItem('snake-best', best); }
      updateHud();
      title.textContent = '游戏结束';
      text.textContent = '得分 ' + score + (score >= best ? ' · 新纪录！' : '');
      btn.textContent = '再来一局';
      overlay.classList.add('show');
      return;
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      tickMs = Math.max(70, tickMs - 2);
      placeFood(); updateHud();
    } else {
      snake.pop();
    }
  }
  function draw() {
    ctx.fillStyle = '#0b1020';
    ctx.fillRect(0, 0, COLS * T, ROWS * T);
    ctx.strokeStyle = 'rgba(255,255,255,.035)';
    for (let i = 1; i < COLS; i++) { ctx.beginPath(); ctx.moveTo(i * T, 0); ctx.lineTo(i * T, ROWS * T); ctx.stroke(); }
    for (let i = 1; i < ROWS; i++) { ctx.beginPath(); ctx.moveTo(0, i * T); ctx.lineTo(COLS * T, i * T); ctx.stroke(); }
    if (!snake) return;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc((food.x + 0.5) * T, (food.y + 0.5) * T, T * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fca5a5';
    ctx.beginPath();
    ctx.arc((food.x + 0.38) * T, (food.y + 0.36) * T, 3, 0, Math.PI * 2);
    ctx.fill();
    snake.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? '#7c5cff' : i % 2 ? '#4f8cff' : '#406fd0';
      ctx.beginPath();
      ctx.roundRect(s.x * T + 2, s.y * T + 2, T - 4, T - 4, 6);
      ctx.fill();
    });
    if (snake[0]) {
      ctx.fillStyle = '#e2e8f0';
      const hx = snake[0].x * T, hy = snake[0].y * T;
      ctx.fillRect(hx + (dir.x === -1 ? 5 : 14), hy + 7, 4, 4);
      ctx.fillRect(hx + (dir.x === -1 ? 5 : 14), hy + 15, 4, 4);
    }
  }
  function loop(ts) {
    const dt = Math.min(50, ts - last || 16); last = ts;
    if (active && state === 'playing') {
      acc += dt;
      while (acc >= tickMs) { step(); acc -= tickMs; }
    }
    draw();
    requestAnimationFrame(loop);
  }

  const keys = { arrowup: [0, -1], arrowdown: [0, 1], arrowleft: [-1, 0], arrowright: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] };
  const dirMap = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  window.addEventListener('keydown', e => {
    if (!active) return;
    const k = e.key.toLowerCase();
    if (keys[k]) { e.preventDefault(); setDir(keys[k][0], keys[k][1]); }
    if (e.code === 'Space') {
      e.preventDefault();
      if (state === 'playing') {
        state = 'paused'; title.textContent = '已暂停'; text.textContent = '按按钮继续';
        btn.textContent = '继续游戏'; overlay.classList.add('show');
      } else if (state === 'paused') { state = 'playing'; overlay.classList.remove('show'); }
    }
  });
  document.querySelectorAll('#snake [data-dir]').forEach(b => {
    const d = dirMap[b.dataset.dir];
    b.addEventListener('pointerdown', e => { e.preventDefault(); if (d) setDir(d[0], d[1]); });
  });
  let start = null;
  canvas.addEventListener('pointerdown', e => { start = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener('pointerup', e => {
    if (!start) return;
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 20) setDir(Math.sign(dx), 0);
    else if (Math.abs(dy) > 20) setDir(0, Math.sign(dy));
    start = null;
  });
  btn.addEventListener('click', () => {
    window.arcadeFs.enter(document.getElementById('snakeShell'));
    if (state === 'paused') { state = 'playing'; overlay.classList.remove('show'); }
    else reset();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { active = entries[0].isIntersecting; }, { threshold: 0.1 }).observe(canvas);
  } else active = true;
  updateHud();
  requestAnimationFrame(loop);
})();
