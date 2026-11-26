// ============ 炸弹人（纯 JS / Canvas，无外部依赖） ============
    (function () {
      const canvas = document.getElementById('gameCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const COLS = 15, ROWS = 13, T = 32, WALL = 1, BRICK = 2;
      const el = id => document.getElementById(id);
      const hud = { level: el('gLevel'), score: el('gScore'), lives: el('gLives'), bomb: el('gBomb'), fire: el('gFire') };
      const overlay = el('gameOverlay'), overlayTitle = el('overlayTitle'), overlayText = el('overlayText'), overlayBtn = el('overlayBtn');

      let grid, player, enemies, bombs, flames, drops;
      let score = 0, lives = 3, level = 1, maxBombs = 1, fireRange = 2, stepMs = 150;
      let state = 'ready', gameActive = false, invuln = 0, last = 0;
      const keys = new Set();
      let touchDir = null;

      function inBounds(x, y) { return x >= 0 && y >= 0 && x < COLS && y < ROWS; }
      function walkable(x, y) {
        return x > 0 && y > 0 && x < COLS - 1 && y < ROWS - 1 && grid[y][x] === 0 &&
          !bombs.some(b => !b.exploded && b.x === x && b.y === y);
      }
      function makeMaze() {
        grid = Array.from({ length: ROWS }, (_, y) => Array.from({ length: COLS }, (_, x) => {
          if (x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1) return WALL;
          if (x % 2 === 0 && y % 2 === 0) return WALL;
          return Math.random() < 0.72 ? BRICK : 0;
        }));
        [[1, 1], [2, 1], [1, 2]].forEach(p => { grid[p[1]][p[0]] = 0; });
        [[COLS - 2, 1], [COLS - 2, 2], [COLS - 2, ROWS - 2], [COLS - 2, ROWS - 3], [1, ROWS - 2], [2, ROWS - 2]]
          .forEach(p => { grid[p[1]][p[0]] = 0; });
      }
      function actor(x, y) { return { x, y, tx: x, ty: y, t: 1, moving: false, stepMs: 150, last: null, dead: false }; }
      function spawnEnemies() {
        const spots = [[COLS - 2, 1], [COLS - 2, ROWS - 2], [1, ROWS - 2], [COLS - 2, ROWS - 3], [COLS - 2, 2]];
        enemies = spots.slice(0, Math.min(spots.length, 2 + level)).map(p => actor(p[0], p[1]));
      }
      function updateHud() {
        hud.level.textContent = level; hud.score.textContent = score; hud.lives.textContent = lives;
        hud.bomb.textContent = maxBombs; hud.fire.textContent = fireRange;
      }
      function showOverlay(title, text, btn) {
        overlayTitle.textContent = title; overlayText.textContent = text;
        overlayBtn.textContent = btn; overlay.classList.add('show');
      }
      function resetLevel() {
        bombs = []; flames = []; drops = []; invuln = 0;
        makeMaze(); player = actor(1, 1); spawnEnemies();
        stepMs = Math.max(100, 155 - (level - 1) * 8);
        state = 'playing'; updateHud(); overlay.classList.remove('show');
      }
      function newGame() { score = 0; lives = 3; level = 1; maxBombs = 1; fireRange = 2; resetLevel(); }
      function pos(a) {
        return { x: (a.x + (a.tx - a.x) * a.t + 0.5) * T, y: (a.y + (a.ty - a.y) * a.t + 0.5) * T };
      }
      function tryMove(a, dx, dy, ms) {
        if (a.moving) return;
        const nx = a.x + dx, ny = a.y + dy;
        if (!walkable(nx, ny)) return;
        a.tx = nx; a.ty = ny; a.t = 0; a.moving = true; a.stepMs = ms;
      }
      function advance(a, dt) {
        if (!a.moving) return;
        a.t += dt / a.stepMs;
        if (a.t >= 1) { a.x = a.tx; a.y = a.ty; a.t = 1; a.moving = false; }
      }
      function placeBomb() {
        if (state !== 'playing' || !gameActive) return;
        if (bombs.some(b => !b.exploded && b.x === player.x && b.y === player.y)) return;
        if (bombs.filter(b => !b.exploded).length >= maxBombs) return;
        bombs.push({ x: player.x, y: player.y, timer: 2000, range: fireRange, exploded: false });
      }
      function explode(b) {
        if (b.exploded) return;
        b.exploded = true;
        const cells = [{ x: b.x, y: b.y }];
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(d => {
          for (let r = 1; r <= b.range; r++) {
            const x = b.x + d[0] * r, y = b.y + d[1] * r;
            if (!inBounds(x, y) || grid[y][x] === WALL) break;
            cells.push({ x, y });
            if (grid[y][x] === BRICK) {
              grid[y][x] = 0;
              if (Math.random() < 0.22) {
                const kinds = ['fire', 'bomb', 'speed'];
                drops.push({ x, y, kind: kinds[Math.floor(Math.random() * kinds.length)] });
              }
              break;
            }
          }
        });
        flames.push({ cells, t: 0 });
        bombs.forEach(other => {
          if (!other.exploded && cells.some(c => c.x === other.x && c.y === other.y)) explode(other);
        });
      }
      function hitPlayer() {
        if (invuln > 0 || state !== 'playing') return;
        lives--; updateHud();
        if (lives <= 0) {
          state = 'over';
          showOverlay('游戏结束', '本次得分 ' + score + '，再试一次？', '重新开始');
          return;
        }
        invuln = 1800; player = actor(1, 1);
      }
      function levelClear() {
        if (state !== 'playing') return;
        state = 'clear'; score += 500; updateHud();
        showOverlay('关卡通过！', '进入第 ' + (level + 1) + ' 关', '下一关');
      }
      function damage() {
        if (state !== 'playing') return;
        flames.forEach(f => {
          f.cells.forEach(c => {
            const cx = (c.x + 0.5) * T, cy = (c.y + 0.5) * T;
            const pp = pos(player);
            if (invuln <= 0 && Math.hypot(pp.x - cx, pp.y - cy) < T * 0.72) hitPlayer();
            enemies.forEach(e => {
              if (!e.dead) {
                const ep = pos(e);
                if (Math.hypot(ep.x - cx, ep.y - cy) < T * 0.72) e.dead = true;
              }
            });
          });
        });
        const before = enemies.length;
        enemies = enemies.filter(e => !e.dead);
        if (enemies.length < before) {
          score += (before - enemies.length) * 100; updateHud();
          if (!enemies.length) levelClear();
        }
      }
      function enemyAI(dt) {
        enemies.forEach(e => {
          if (e.moving) { advance(e, dt); return; }
          if (Math.random() < 0.03) return;
          const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(d => walkable(e.x + d[0], e.y + d[1]));
          if (!dirs.length) return;
          let choices = dirs;
          if (e.last && dirs.length > 1 && Math.random() < 0.8) {
            const noBack = dirs.filter(d => d[0] !== -e.last[0] || d[1] !== -e.last[1]);
            if (noBack.length) choices = noBack;
          }
          const d = choices[Math.floor(Math.random() * choices.length)];
          e.last = d;
          tryMove(e, d[0], d[1], Math.max(180, 300 - level * 10));
        });
      }
      function playerInput() {
        if (state !== 'playing') return;
        let dx = 0, dy = 0;
        if (keys.has('arrowup') || keys.has('w') || touchDir === 'up') dy = -1;
        else if (keys.has('arrowdown') || keys.has('s') || touchDir === 'down') dy = 1;
        else if (keys.has('arrowleft') || keys.has('a') || touchDir === 'left') dx = -1;
        else if (keys.has('arrowright') || keys.has('d') || touchDir === 'right') dx = 1;
        if (dx || dy) tryMove(player, dx, dy, stepMs);
      }
      function collisions() {
        if (state !== 'playing' || invuln > 0) return;
        const pp = pos(player);
        enemies.forEach(e => {
          const ep = pos(e);
          if (Math.hypot(pp.x - ep.x, pp.y - ep.y) < T * 0.75) hitPlayer();
        });
        drops = drops.filter(d => {
          if (Math.hypot(pp.x - (d.x + 0.5) * T, pp.y - (d.y + 0.5) * T) < T * 0.7) {
            if (d.kind === 'fire') fireRange++;
            else if (d.kind === 'bomb') maxBombs++;
            else stepMs = Math.max(80, stepMs - 15);
            score += 50; updateHud(); return false;
          }
          return true;
        });
      }
      function draw() {
        ctx.fillStyle = '#0b1020'; ctx.fillRect(0, 0, COLS * T, ROWS * T);
        for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
          const v = grid[y][x], px = x * T, py = y * T;
          if (v === 0) { ctx.fillStyle = (x + y) % 2 ? '#121a30' : '#17213c'; ctx.fillRect(px, py, T, T); }
          else if (v === WALL) {
            ctx.fillStyle = '#263352'; ctx.fillRect(px, py, T, T);
            ctx.fillStyle = '#3b4d78'; ctx.fillRect(px + 2, py + 2, T - 4, T - 4);
          } else {
            ctx.fillStyle = '#7a4e32'; ctx.fillRect(px, py, T, T);
            ctx.fillStyle = '#b4764a'; ctx.fillRect(px + 2, py + 2, T - 4, T - 4);
            ctx.fillStyle = '#624028'; ctx.fillRect(px + 7, py + 7, 4, 4); ctx.fillRect(px + 21, py + 19, 4, 4);
          }
        }
        drops.forEach(d => {
          const cx = (d.x + 0.5) * T, cy = (d.y + 0.5) * T;
          ctx.fillStyle = d.kind === 'fire' ? '#ff8a3d' : d.kind === 'bomb' ? '#9b7cff' : '#34d399';
          ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#0a0e1a'; ctx.font = 'bold 10px Arial';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(d.kind === 'fire' ? 'F' : d.kind === 'bomb' ? 'B' : 'S', cx, cy + 1);
        });
        bombs.forEach(b => {
          const cx = (b.x + 0.5) * T, cy = (b.y + 0.5) * T;
          ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.arc(cx, cy + 2, 11, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = b.timer < 700 ? '#ff5252' : '#94a3b8';
          ctx.beginPath(); ctx.arc(cx + 4, cy - 8, 3, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(cx + 4, cy - 9); ctx.lineTo(cx + 8, cy - 15); ctx.stroke();
        });
        flames.forEach(f => {
          const a = Math.max(0, 1 - f.t / 520);
          f.cells.forEach(c => {
            ctx.fillStyle = 'rgba(255,' + Math.round(110 + 110 * a) + ',40,' + a + ')';
            ctx.fillRect(c.x * T + 2, c.y * T + 2, T - 4, T - 4);
            ctx.fillStyle = 'rgba(255,244,170,' + (a * 0.85) + ')';
            ctx.fillRect(c.x * T + 10, c.y * T + 10, T - 20, T - 20);
          });
        });
        if (invuln <= 0 || Math.floor(invuln / 120) % 2 === 0) {
          const p = pos(player);
          ctx.fillStyle = '#4f8cff'; ctx.beginPath(); ctx.arc(p.x, p.y, 11, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#e8edf7'; ctx.beginPath(); ctx.arc(p.x, p.y - 3, 8, Math.PI, 0); ctx.fill();
          ctx.fillStyle = '#0a0e1a'; ctx.fillRect(p.x - 6, p.y - 5, 3, 3); ctx.fillRect(p.x + 3, p.y - 5, 3, 3);
          ctx.fillStyle = '#ffd166'; ctx.fillRect(p.x - 9, p.y + 7, 18, 4);
        }
        enemies.forEach(e => {
          const p = pos(e);
          ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(p.x, p.y, 11, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(p.x - 4, p.y - 2, 3, 0, Math.PI * 2); ctx.arc(p.x + 4, p.y - 2, 3, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#111827'; ctx.fillRect(p.x - 5, p.y - 2, 2, 2); ctx.fillRect(p.x + 3, p.y - 2, 2, 2);
          ctx.fillStyle = '#fca5a5'; ctx.fillRect(p.x - 8, p.y + 7, 16, 3);
        });
      }
      function loop(ts) {
        const dt = Math.min(50, ts - last || 16); last = ts;
        if (state === 'playing' && gameActive) {
          playerInput(); advance(player, dt); enemyAI(dt);
          bombs.forEach(b => { b.timer -= dt; if (b.timer <= 0) explode(b); });
          bombs = bombs.filter(b => !b.exploded);
          flames.forEach(f => { f.t += dt; }); flames = flames.filter(f => f.t < 520);
          damage(); collisions();
          if (invuln > 0) invuln -= dt;
        }
        draw(); requestAnimationFrame(loop);
      }
      const dirKeys = { arrowup: 1, arrowdown: 1, arrowleft: 1, arrowright: 1, w: 1, a: 1, s: 1, d: 1 };
      window.addEventListener('keydown', e => {
        if (!gameActive) return;
        const k = e.key.toLowerCase();
        if (dirKeys[k]) { keys.add(k); e.preventDefault(); }
        if (e.code === 'Space' || k === ' ') { e.preventDefault(); if (!e.repeat) placeBomb(); }
      });
      window.addEventListener('keyup', e => { keys.delete(e.key.toLowerCase()); });
      window.addEventListener('blur', () => { keys.clear(); touchDir = null; });
      document.querySelectorAll('[data-dir]').forEach(btn => {
        const dir = btn.dataset.dir;
        btn.addEventListener('pointerdown', e => { e.preventDefault(); touchDir = dir; gameActive = true; });
        ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev =>
          btn.addEventListener(ev, () => { if (touchDir === dir) touchDir = null; }));
      });
      el('touchBomb').addEventListener('pointerdown', e => { e.preventDefault(); gameActive = true; placeBomb(); });

      // 全屏由 common.js 统一管理
      const shell = el('gameShell');
      overlayBtn.addEventListener('click', () => {
        window.arcadeFs.enter(shell);
        if (state === 'clear') { level++; resetLevel(); } else newGame();
      });
      canvas.addEventListener('pointerdown', () => { gameActive = true; canvas.focus(); });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(entries => {
          gameActive = entries[0].isIntersecting;
          if (!gameActive) { keys.clear(); touchDir = null; }
        }, { threshold: 0.15 }).observe(canvas);
      }
      makeMaze(); player = actor(1, 1); enemies = []; bombs = []; flames = []; drops = []; updateHud();
      requestAnimationFrame(loop);
    })();
