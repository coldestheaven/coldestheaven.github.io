// 打砖块：纯 Canvas 实现，支持鼠标 / 触屏 / 键盘
(function () {
  const canvas = document.getElementById('breakoutCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = 480, H = 400;
  const overlay = document.getElementById('breakoutOverlay');
  const title = document.getElementById('breakoutOverlayTitle');
  const text = document.getElementById('breakoutOverlayText');
  const btn = document.getElementById('breakoutOverlayBtn');
  const scoreEl = document.getElementById('breakoutScore');
  const livesEl = document.getElementById('breakoutLives');
  const levelEl = document.getElementById('breakoutLevel');

  const COLS = 8, ROWS = 5, BW = 54, BH = 18, GAP = 6, LEFT = 24, TOP = 36;
  let bricks = [], paddle, ball, score = 0, lives = 3, level = 1;
  let state = 'ready', active = false, last = 0;
  const pressed = new Set();

  function updateHud() {
    scoreEl.textContent = score;
    livesEl.textContent = lives;
    levelEl.textContent = level;
  }
  function buildBricks() {
    bricks = [];
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#4f8cff'];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        bricks.push({ x: LEFT + c * (BW + GAP), y: TOP + r * (BH + GAP), w: BW, h: BH, color: colors[r], alive: true });
      }
    }
  }
  function resetBall() {
    paddle = { x: (W - 84) / 2, y: H - 28, w: 84, h: 12, speed: 7 };
    ball = { x: W / 2, y: H - 48, r: 7, vx: 3.2 + level * 0.25, vy: -(3.6 + level * 0.25), stuck: true };
  }
  function start() {
    score = 0; lives = 3; level = 1;
    buildBricks(); resetBall(); updateHud();
    state = 'playing'; overlay.classList.remove('show');
  }
  function launch() {
    if (ball && ball.stuck) { ball.stuck = false; ball.vy = -(3.6 + level * 0.25); }
  }
  function gameOver(win) {
    state = win ? 'clear' : 'over';
    title.textContent = win ? '过关！' : '游戏结束';
    text.textContent = win ? '得分 ' + score + ' · 点击按钮进入下一关' : '得分 ' + score;
    btn.textContent = win ? '下一关' : '再来一局';
    overlay.classList.add('show');
  }

  function update(dt) {
    if (state !== 'playing' || !active) return;
    if (pressed.has('left')) paddle.x -= paddle.speed;
    if (pressed.has('right')) paddle.x += paddle.speed;
    paddle.x = Math.max(0, Math.min(W - paddle.w, paddle.x));
    if (ball.stuck) {
      ball.x = paddle.x + paddle.w / 2;
      ball.y = paddle.y - ball.r - 2;
      return;
    }
    ball.x += ball.vx; ball.y += ball.vy;
    if (ball.x - ball.r < 0) { ball.x = ball.r; ball.vx *= -1; }
    if (ball.x + ball.r > W) { ball.x = W - ball.r; ball.vx *= -1; }
    if (ball.y - ball.r < 0) { ball.y = ball.r; ball.vy *= -1; }
    if (ball.vy > 0 && ball.y + ball.r >= paddle.y && ball.y - ball.r <= paddle.y + paddle.h &&
        ball.x >= paddle.x && ball.x <= paddle.x + paddle.w) {
      ball.y = paddle.y - ball.r;
      const hit = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
      const speed = Math.min(9, Math.hypot(ball.vx, ball.vy) + 0.08);
      ball.vx = hit * speed * 0.9;
      ball.vy = -Math.sqrt(Math.max(4, speed * speed - ball.vx * ball.vx));
    }
    bricks.forEach(b => {
      if (!b.alive) return;
      if (ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w &&
          ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h) {
        b.alive = false;
        ball.vy *= -1;
        score += 10; updateHud();
      }
    });
    if (bricks.every(b => !b.alive)) gameOver(true);
    if (ball.y - ball.r > H) {
      lives--; updateHud();
      if (lives <= 0) gameOver(false);
      else { resetBall(); }
    }
  }
  function draw() {
    ctx.fillStyle = '#0b1020';
    ctx.fillRect(0, 0, W, H);
    bricks.forEach(b => {
      if (!b.alive) return;
      ctx.fillStyle = b.color;
      ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 4); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.18)';
      ctx.fillRect(b.x + 2, b.y + 2, b.w - 4, 3);
    });
    ctx.fillStyle = '#4f8cff';
    ctx.beginPath(); ctx.roundRect(paddle.x, paddle.y, paddle.w, paddle.h, 6); ctx.fill();
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fill();
    if (ball.stuck && state === 'playing') {
      ctx.fillStyle = 'rgba(226,232,240,.7)';
      ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('点击画面发球', W / 2, H / 2 + 60);
    }
  }
  function loop(ts) {
    const dt = Math.min(40, ts - last || 16); last = ts;
    update(dt); draw();
    requestAnimationFrame(loop);
  }

  const keyMap = { arrowleft: 'left', arrowright: 'right', a: 'left', d: 'right' };
  window.addEventListener('keydown', e => {
    if (!active) return;
    const k = e.key.toLowerCase();
    if (keyMap[k]) { e.preventDefault(); pressed.add(keyMap[k]); }
    if (e.code === 'Space') { e.preventDefault(); if (state === 'playing') launch(); }
  });
  window.addEventListener('keyup', e => {
    const k = e.key.toLowerCase();
    if (keyMap[k]) pressed.delete(keyMap[k]);
  });
  document.querySelectorAll('#breakout [data-dir]').forEach(b => {
    const dir = b.dataset.dir === 'left' ? 'left' : 'right';
    b.addEventListener('pointerdown', e => { e.preventDefault(); pressed.add(dir); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev =>
      b.addEventListener(ev, () => pressed.delete(dir)));
  });
  let dragging = false;
  function movePaddle(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * W;
    paddle.x = Math.max(0, Math.min(W - paddle.w, x - paddle.w / 2));
  }
  canvas.addEventListener('pointerdown', e => {
    e.preventDefault(); dragging = true; movePaddle(e);
    if (state === 'playing') launch();
  });
  canvas.addEventListener('pointermove', e => { if (dragging) movePaddle(e); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev =>
    canvas.addEventListener(ev, () => { dragging = false; }));
  btn.addEventListener('click', () => {
    window.arcadeFs.enter(document.getElementById('breakoutShell'));
    if (state === 'clear') {
      level++; buildBricks(); resetBall(); state = 'playing'; overlay.classList.remove('show');
    } else start();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { active = entries[0].isIntersecting; }, { threshold: 0.1 }).observe(canvas);
  } else active = true;
  buildBricks(); resetBall(); updateHud();
  requestAnimationFrame(loop);
})();
