// 2048：方向键 / WASD / 滑动合并数字，最高分存本地
(function () {
  const board = document.getElementById('board2048');
  if (!board) return;
  const scoreEl = document.getElementById('g2048Score');
  const bestEl = document.getElementById('g2048Best');
  const overlay = document.getElementById('g2048Overlay');
  const title = document.getElementById('g2048OverlayTitle');
  const text = document.getElementById('g2048OverlayText');
  const btn = document.getElementById('g2048OverlayBtn');
  const restart = document.getElementById('g2048Restart');
  let grid, score, best = Number(localStorage.getItem('gdb2048best') || 0);
  let state = 'ready', active = false;
  let startX = 0, startY = 0;

  function emptyCells() {
    const cells = [];
    grid.forEach((row, y) => row.forEach((v, x) => { if (!v) cells.push([x, y]); }));
    return cells;
  }
  function addTile() {
    const cells = emptyCells();
    if (!cells.length) return;
    const [x, y] = cells[Math.floor(Math.random() * cells.length)];
    grid[y][x] = Math.random() < 0.9 ? 2 : 4;
  }
  function slide(line) {
    const nums = line.filter(Boolean), out = [];
    for (let i = 0; i < nums.length; i++) {
      if (nums[i] === nums[i + 1]) { out.push(nums[i] * 2); score += nums[i] * 2; i++; }
      else out.push(nums[i]);
    }
    while (out.length < 4) out.push(0);
    return out;
  }
  function canMove() {
    if (emptyCells().length) return true;
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
      if (x < 3 && grid[y][x] === grid[y][x + 1]) return true;
      if (y < 3 && grid[y][x] === grid[y + 1][x]) return true;
    }
    return false;
  }
  function render() {
    board.innerHTML = '';
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
      const v = grid[y][x];
      const cell = document.createElement('div');
      cell.className = 'cell2048' + (v ? ' has v' + (v > 2048 ? 'super' : v) : '');
      if (v) cell.textContent = v;
      board.appendChild(cell);
    }
    scoreEl.textContent = score;
    bestEl.textContent = best;
  }
  function move(dir) {
    if (state !== 'playing' || !active) return;
    const before = grid.map(r => r.slice());
    for (let i = 0; i < 4; i++) {
      let line;
      if (dir === 'left') line = grid[i].slice();
      else if (dir === 'right') line = grid[i].slice().reverse();
      else if (dir === 'up') line = grid.map(r => r[i]);
      else line = grid.map(r => r[i]).reverse();
      const out = slide(line);
      for (let j = 0; j < 4; j++) {
        if (dir === 'left') grid[i][j] = out[j];
        else if (dir === 'right') grid[i][3 - j] = out[j];
        else if (dir === 'up') grid[j][i] = out[j];
        else grid[3 - j][i] = out[j];
      }
    }
    const changed = grid.some((row, y) => row.some((v, x) => v !== before[y][x]));
    if (changed) {
      addTile();
      if (score > best) { best = score; localStorage.setItem('gdb2048best', String(best)); }
      render();
      if (!canMove()) {
        state = 'over';
        title.textContent = '无路可走';
        text.textContent = '最终得分 ' + score + '，再试一次？';
        btn.textContent = '重新开始';
        overlay.classList.add('show');
      }
    }
  }
  function start() {
    grid = Array.from({ length: 4 }, () => Array(4).fill(0));
    score = 0; state = 'playing';
    addTile(); addTile(); render();
    overlay.classList.remove('show');
  }
  const keyMap = {
    ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
    a: 'left', d: 'right', w: 'up', s: 'down'
  };
  window.addEventListener('keydown', e => {
    if (!active) return;
    const dir = keyMap[e.key] || keyMap[e.key.toLowerCase()];
    if (dir && state === 'playing') { e.preventDefault(); move(dir); }
  });
  board.addEventListener('pointerdown', e => { startX = e.clientX; startY = e.clientY; });
  board.addEventListener('pointerup', e => {
    const dx = e.clientX - startX, dy = e.clientY - startY;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  });
  restart.addEventListener('click', () => { start(); });
  btn.addEventListener('click', () => {
    window.arcadeFs.enter(document.getElementById('g2048Shell'));
    start();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { active = entries[0].isIntersecting; }, { threshold: 0.1 }).observe(board);
  } else active = true;
  grid = Array.from({ length: 4 }, () => Array(4).fill(0));
  addTile(); addTile(); render();
})();
