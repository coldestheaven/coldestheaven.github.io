// 坦克大战：纯 Canvas 实现，网格移动 + 子弹 + 基地防守
(function () {
  const canvas = document.getElementById('tankCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const COLS = 20, ROWS = 20, T = 24;
  const EMPTY = 0, BRICK = 1, STEEL = 2, BASE = 3;
  const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];

  const overlay = document.getElementById('tankOverlay');
  const title = document.getElementById('tankOverlayTitle');
  const text = document.getElementById('tankOverlayText');
  const btn = document.getElementById('tankOverlayBtn');
  const levelEl = document.getElementById('tankLevel');
  const scoreEl = document.getElementById('tankScore');
  const livesEl = document.getElementById('tankLives');
  const leftEl = document.getElementById('tankLeft');
  const powerEl = document.getElementById('tankPower');

  let grid, player, enemies, bullets, effects, powerups;
  let level = 1, score = 0, lives = 3, totalEnemies = 0, spawned = 0, killed = 0;
  let state = 'ready', active = false, invuln = 0, last = 0;
  const keys = new Set();
  let touchDir = null, touchFire = false;

  function updateHud() {
    levelEl.textContent = level;
    scoreEl.textContent = score;
    livesEl.textContent = lives;
    leftEl.textContent = Math.max(0, totalEnemies - killed);
    if (powerEl) powerEl.textContent = player ? player.power : 1;
  }
  function buildMap() {
    grid = Array.from({ length: ROWS }, (_, y) => Array.from({ length: COLS }, (_, x) => {
      if (x === 0 && y === 0) return EMPTY;
      if (Math.random() < 0.05 && x > 1 && x < COLS - 2 && y > 3 && y < ROWS - 2) return STEEL;
      return Math.random() < 0.3 ? BRICK : EMPTY;
    }));
    const clear = (x, y) => { if (grid[y] && grid[y][x] !== undefined) grid[y][x] = EMPTY; };
    [[0, 0], [1, 0], [0, 1], [9, 0], [8, 0], [10, 0], [9, 1], [18, 0], [19, 0], [18, 1],
      [2, 18], [2, 19], [3, 18], [3, 19], [1, 18], [1, 19]].forEach(p => clear(p[0], p[1]));
    grid[18][9] = BASE;
    [[8, 18], [10, 18], [9, 17], [8, 17], [10, 17]].forEach(p => { grid[p[1]][p[0]] = BRICK; });
  }
  function makeTank(x, y, dir, enemy) {
    return { x, y, fx: x, fy: y, tx: x, ty: y, t: 1, moving: false, dir, enemy, cd: 0, power: 1, step: enemy ? 210 : 135 };
  }
  function resetLevel() {
    buildMap();
    player = makeTank(2, 18, 0, false);
    enemies = []; bullets = []; effects = []; powerups = [];
    totalEnemies = 5 + level * 2; spawned = 0; killed = 0; invuln = 1500;
    state = 'playing'; overlay.classList.remove('show'); updateHud();
  }
  function newGame() { score = 0; lives = 3; level = 1; resetLevel(); }
  function end(win) {
    state = win ? 'clear' : 'over';
    title.textContent = win ? '过关！' : '游戏结束';
    text.textContent = win ? '得分 ' + score + ' · 继续挑战下一关' : '得分 ' + score + ' · 基地失守或生命耗尽';
    btn.textContent = win ? '下一关' : '再来一局';
    overlay.classList.add('show');
  }
  function walkable(x, y) {
    return x >= 0 && y >= 0 && x < COLS && y < ROWS && grid[y][x] === EMPTY;
  }
  function fire(tank) {
    if (tank.cd > 0) return;
    if (!tank.enemy && bullets.filter(b => !b.enemy).length >= (tank.power >= 3 ? 2 : 1)) return;
    const d = DIRS[tank.dir];
    const px = (tank.x + 0.5) * T, py = (tank.y + 0.5) * T;
    const speed = tank.enemy ? 0.36 : [0, 0.36, 0.5, 0.62][tank.power] || 0.36;
    bullets.push({
      x: px + d[0] * 13, y: py + d[1] * 13,
      dx: d[0], dy: d[1], speed, power: tank.power || 1, enemy: !!tank.enemy
    });
    tank.cd = tank.enemy ? 1200 : ([0, 330, 260, 200][tank.power] || 330);
  }
  function boom(x, y) { effects.push({ x, y, t: 0, life: 400 }); }
  function popText(x, y, text) { effects.push({ x, y, t: 0, life: 900, text }); }
  function dropStar(x, y) {
    powerups.push({ x, y, vy: 0.022, t: 0, life: 9000 });
  }

  function hitTank(tank) {
    if (tank === player) {
      if (invuln > 0) return;
      lives--; boom((player.x + 0.5) * T, (player.y + 0.5) * T);
      if (lives <= 0) { updateHud(); end(false); return; }
      player = makeTank(2, 18, 0, false); invuln = 1500;
      updateHud();
    } else {
      killed++; score += 100;
      const sx = (tank.x + 0.5) * T, sy = (tank.y + 0.5) * T;
      boom(sx, sy);
      if (Math.random() < 0.45) dropStar(sx, sy);
      enemies = enemies.filter(e => e !== tank);
      updateHud();
      if (killed >= totalEnemies) end(true);
    }
  }

  function update(dt) {
    if (state !== 'playing' || !active) return;
    if (invuln > 0) invuln -= dt;
    player.cd -= dt;
    if (spawned < totalEnemies && enemies.length < 3 && Math.random() < 0.012 * dt / 16) {
      const spots = [[0, 0], [9, 0], [18, 0]];
      const s = spots[spawned % spots.length];
      if (walkable(s[0], s[1])) { enemies.push(makeTank(s[0], s[1], 2, true)); spawned++; }
    }
    // 玩家输入
    let dx = 0, dy = 0;
    if (keys.has('arrowup') || keys.has('w') || touchDir === 'up') dy = -1;
    else if (keys.has('arrowdown') || keys.has('s') || touchDir === 'down') dy = 1;
    else if (keys.has('arrowleft') || keys.has('a') || touchDir === 'left') dx = -1;
    else if (keys.has('arrowright') || keys.has('d') || touchDir === 'right') dx = 1;
    if (dx || dy) {
      player.dir = dx > 0 ? 1 : dx < 0 ? 3 : dy > 0 ? 2 : 0;
      if (!player.moving && walkable(player.x + dx, player.y + dy)) {
        player.tx = player.x + dx; player.ty = player.y + dy; player.t = 0; player.moving = true;
      }
    }
    if (touchFire || keys.has(' ')) fire(player);
    // 敌军 AI
    enemies.forEach(e => {
      e.cd -= dt;
      if (e.cd <= 0 && Math.random() < 0.02) { fire(e); e.cd = 800 + Math.random() * 900; }
      if (e.moving) {
        e.t += dt / e.step;
        if (e.t >= 1) { e.x = e.tx; e.y = e.ty; e.t = 1; e.moving = false; }
        return;
      }
      const dirs = DIRS.map((d, i) => ({ d, i })).filter(o => walkable(e.x + o.d[0], e.y + o.d[1]));
      if (!dirs.length) return;
      let choice = dirs.find(o => o.i === 2) || dirs[Math.floor(Math.random() * dirs.length)];
      if (Math.random() < 0.35) choice = dirs[Math.floor(Math.random() * dirs.length)];
      e.dir = choice.i;
      e.tx = e.x + choice.d[0]; e.ty = e.y + choice.d[1]; e.t = 0; e.moving = true;
    });
    if (player.moving) {
      player.t += dt / player.step;
      if (player.t >= 1) { player.x = player.tx; player.y = player.ty; player.t = 1; player.moving = false; }
    }
    // 子弹
    bullets = bullets.filter(b => {
      b.x += b.dx * b.speed * dt; b.y += b.dy * b.speed * dt;
      if (b.x < 0 || b.y < 0 || b.x > COLS * T || b.y > ROWS * T) return false;
      const tx = Math.floor(b.x / T), ty = Math.floor(b.y / T);
      if (grid[ty] && grid[ty][tx] !== undefined && grid[ty][tx] !== EMPTY) {
        if (grid[ty][tx] === BRICK || (grid[ty][tx] === STEEL && b.power >= 3)) grid[ty][tx] = EMPTY;
        if (grid[ty][tx] === BASE) { boom(b.x, b.y); end(false); }
        return false;
      }
      if (b.enemy) {
        if (invuln <= 0 && Math.abs(b.x - (player.x + 0.5) * T) < 11 &&
            Math.abs(b.y - (player.y + 0.5) * T) < 11) { hitTank(player); return false; }
      } else {
        const victim = enemies.find(e => Math.abs(b.x - (e.x + 0.5) * T) < 11 && Math.abs(b.y - (e.y + 0.5) * T) < 11);
        if (victim) { hitTank(victim); return false; }
      }
      return true;
    });
    // 玩家撞上敌军
    if (invuln <= 0) {
      const hit = enemies.find(e => Math.abs((e.x + 0.5) * T - (player.x + 0.5) * T) < 18 &&
        Math.abs((e.y + 0.5) * T - (player.y + 0.5) * T) < 18);
      if (hit) hitTank(player);
    }
    // ⭐ 掉落物：缓慢下落，落地后等待玩家拾取
    powerups.forEach(p => {
      p.t += dt; p.life -= dt;
      if (p.vy > 0) {
        p.y += p.vy * dt;
        if (p.y >= ROWS * T - 10) { p.y = ROWS * T - 10; p.vy = 0; }
        else {
          const below = Math.floor((p.y + 8) / T);
          const col = Math.floor(p.x / T);
          if (grid[below] && grid[below][col] !== undefined && grid[below][col] !== EMPTY) {
            p.y = below * T - 9; p.vy = 0;
          }
        }
      }
      if (p.life > 0 && invuln <= 0 &&
          Math.abs(p.x - (player.x + 0.5) * T) < 13 &&
          Math.abs(p.y - (player.y + 0.5) * T) < 13) {
        p.life = 0;
        const old = player.power;
        player.power = Math.min(3, player.power + 1);
        player.step = [0, 135, 118, 100][player.power] || 135;
        score += 200; updateHud();
        if (player.power > old) popText(p.x, p.y - 6, '升级!');
      }
    });
    powerups = powerups.filter(p => p.life > 0);
    effects.forEach(f => f.t += dt);
    effects = effects.filter(f => f.t < f.life);
  }

  function drawStar(x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5;
      const rr = i % 2 ? r * 0.45 : r;
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath(); ctx.fill();
  }
  function drawTank(t) {
    const x = (t.x + (t.tx - t.x) * t.t + 0.5) * T;
    const y = (t.y + (t.ty - t.y) * t.t + 0.5) * T;
    const c = t.enemy ? '#ef4444' : '#4ade80';
    ctx.save(); ctx.translate(x, y);
    ctx.rotate(t.dir * Math.PI / 2);
    ctx.fillStyle = c;
    ctx.fillRect(-9, -10, 18, 20);
    ctx.fillStyle = t.enemy ? '#7f1d1d' : '#14532d';
    ctx.fillRect(-11, -8, 3, 16); ctx.fillRect(8, -8, 3, 16);
    ctx.fillStyle = '#0f172a'; ctx.fillRect(-2, -14, 4, 9);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-4, -5, 8, 3);
    if (!t.enemy && t.power > 1) {
      ctx.fillStyle = '#fde047';
      for (let i = 0; i < t.power - 1; i++) ctx.fillRect(-6 + i * 5, 2, 3, 5);
    }
    ctx.restore();
  }
  function draw() {
    ctx.fillStyle = '#0b1020'; ctx.fillRect(0, 0, COLS * T, ROWS * T);
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const v = grid ? grid[y][x] : EMPTY;
      if (v === BRICK) {
        ctx.fillStyle = '#a55a35'; ctx.fillRect(x * T, y * T, T, T);
        ctx.fillStyle = '#c97a4b'; ctx.fillRect(x * T + 1, y * T + 1, T - 2, T - 2);
        ctx.fillStyle = '#8a4529'; ctx.fillRect(x * T + 2, y * T + 11, T - 4, 2);
      } else if (v === STEEL) {
        ctx.fillStyle = '#64748b'; ctx.fillRect(x * T, y * T, T, T);
        ctx.fillStyle = '#94a3b8'; ctx.fillRect(x * T + 2, y * T + 2, T - 4, T - 4);
      } else if (v === BASE) {
        ctx.fillStyle = '#fbbf24'; ctx.fillRect(x * T, y * T, T, T);
        ctx.fillStyle = '#b45309'; ctx.fillRect(x * T + 10, y * T + 4, 3, 17);
        ctx.fillStyle = '#fde68a'; ctx.beginPath();
        ctx.moveTo(x * T + 13, y * T + 5); ctx.lineTo(x * T + 21, y * T + 9); ctx.lineTo(x * T + 13, y * T + 13); ctx.fill();
      }
    }
    if (!player) return;
    if (invuln <= 0 || Math.floor(invuln / 130) % 2 === 0) drawTank(player);
    enemies.forEach(drawTank);
    powerups.forEach(p => {
      if (p.life < 2000 && Math.floor(p.t / 160) % 2 === 0) return;
      ctx.save();
      ctx.shadowColor = '#fde047'; ctx.shadowBlur = 12;
      ctx.fillStyle = '#fde047'; drawStar(p.x, p.y + Math.sin(p.t / 180) * 1.5, 9);
      ctx.restore();
    });
    ctx.fillStyle = '#fde047';
    bullets.forEach(b => ctx.fillRect(b.x - 3, b.y - 3, 6, 6));
    effects.forEach(f => {
      const a = Math.max(0, 1 - f.t / f.life);
      if (f.text) {
        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle = '#fde047'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(f.text, f.x, f.y - f.t / 55);
        ctx.restore();
        return;
      }
      ctx.fillStyle = `rgba(255,${Math.round(120 + 100 * a)},40,${a})`;
      ctx.beginPath(); ctx.arc(f.x, f.y, 6 + 12 * (1 - a), 0, Math.PI * 2); ctx.fill();
    });
  }
  function loop(ts) {
    const dt = Math.min(50, ts - last || 16); last = ts;
    update(dt); draw(); requestAnimationFrame(loop);
  }

  const keyMap = { arrowup: 'up', arrowdown: 'down', arrowleft: 'left', arrowright: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
  window.addEventListener('keydown', e => {
    if (!active) return;
    const k = e.key.toLowerCase();
    if (keyMap[k] || e.code === 'Space') e.preventDefault();
    if (keyMap[k]) keys.add(k);
    if (e.code === 'Space') keys.add(' ');
  });
  window.addEventListener('keyup', e => {
    const k = e.key.toLowerCase();
    keys.delete(k); if (e.code === 'Space') keys.delete(' ');
  });
  const fireBtn = document.getElementById('tankFire');
  const clearDirs = () => {
    keys.clear(); touchDir = null; touchFire = false;
    if (fireBtn) {
      fireBtn.classList.remove('is-pressed');
      fireBtn.setAttribute('aria-pressed', 'false');
    }
  };
  window.addEventListener('blur', clearDirs);
  const stick = document.getElementById('tankJoystick');
  if (stick) {
    stick.addEventListener('joystickmove', e => { touchDir = e.detail.dir; });
    stick.addEventListener('joystickend', () => { touchDir = null; });
  }
  if (fireBtn) {
    fireBtn.setAttribute('aria-pressed', 'false');
    fireBtn.addEventListener('pointerdown', e => {
      e.preventDefault();
      try { fireBtn.setPointerCapture?.(e.pointerId); } catch (_) {}
      touchFire = true; fireBtn.classList.add('is-pressed');
      fireBtn.setAttribute('aria-pressed', 'true');
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev =>
      fireBtn.addEventListener(ev, () => {
        touchFire = false; fireBtn.classList.remove('is-pressed');
        fireBtn.setAttribute('aria-pressed', 'false');
      }));
  }
  btn.addEventListener('click', () => {
    window.arcadeFs.enter(document.getElementById('tankShell'));
    if (state === 'clear') { level++; resetLevel(); } else newGame();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      active = entries[0].isIntersecting;
      if (!active) clearDirs();
    }, { threshold: 0.1 }).observe(canvas);
  } else active = true;
  buildMap(); powerups = []; totalEnemies = 7; updateHud(); requestAnimationFrame(loop);
})();
